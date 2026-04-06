import { Button, Card, message, Modal, Space, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import useContext from "../../libs/context";
import api from "../../libs/api";
import * as faceapi from "face-api.js";

const { Title, Text } = Typography;

export default function SelfAbsence() {
  const { user, modal } = useContext((state: any) => state);
  const [loading, setLoading] = useState(false);
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    // Check if user has face data
    if (user?.face) {
      setFaceRegistered(true);
    }

    // Load face-api models from CDN
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(
          "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights",
        );
        await faceapi.nets.faceLandmark68Net.loadFromUri(
          "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights",
        );
        await faceapi.nets.faceRecognitionNet.loadFromUri(
          "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights",
        );
        setModelsLoaded(true);
      } catch (error) {
        console.error("Error loading face models:", error);
      }
    };
    loadModels();
  }, [user]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCamera(true);
    } catch (error) {
      message.error("Tidak dapat mengakses kamera");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const captureFace = async () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      message.error("Wajah tidak terdeteksi. Pastikan wajah terlihat jelas.");
      return null;
    }

    return detection.descriptor;
  };

  const registerFace = async () => {
    if (!modelsLoaded) {
      message.error("Model face recognition belum dimuat");
      return;
    }

    setLoading(true);
    try {
      await startCamera();
      // Wait for camera to start
      setTimeout(async () => {
        const faceDescriptor = await captureFace();
        if (faceDescriptor) {
          const faceData = Array.from(faceDescriptor);

          // Save face data to user
          await api.request({
            url: `${import.meta.env.VITE_API_URL}/user/face`,
            method: "PUT",
            data: { face: JSON.stringify(faceData) },
          });

          setFaceRegistered(true);
          message.success("Wajah berhasil didaftarkan");
          stopCamera();
        }
        setLoading(false);
      }, 2000);
    } catch (error) {
      message.error("Gagal mendaftarkan wajah");
      setLoading(false);
    }
  };

  const attendWithButton = async () => {
    setLoading(true);
    try {
      await api.request({
        url: `${import.meta.env.VITE_API_URL}/absence/self`,
        method: "POST",
        data: { method: "BUTTON" },
      });
      message.success("Absen berhasil melalui tombol");
    } catch (error) {
      message.error("Gagal absen");
    }
    setLoading(false);
  };

  const attendWithFace = async () => {
    if (!faceRegistered) {
      message.error("Daftarkan wajah terlebih dahulu");
      return;
    }

    if (!modelsLoaded) {
      message.error("Model face recognition belum dimuat");
      return;
    }

    setLoading(true);
    try {
      await startCamera();
      // Wait for camera
      setTimeout(async () => {
        const faceDescriptor = await captureFace();
        if (faceDescriptor) {
          const storedFace = JSON.parse(user.face);
          const distance = faceapi.euclideanDistance(
            faceDescriptor,
            storedFace,
          );

          if (distance < 0.6) {
            // Threshold for face match
            await api.request({
              url: `${import.meta.env.VITE_API_URL}/absence/self`,
              method: "POST",
              data: { method: "FACE" },
            });
            message.success("Absen berhasil melalui face recognition");
          } else {
            message.error("Wajah tidak cocok");
          }
        }
        stopCamera();
        setLoading(false);
      }, 2000);
    } catch (error) {
      message.error("Gagal absen dengan face recognition");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <Title level={2}>Absensi</Title>
          <Text>Selamat datang, {user?.fullname}</Text>
        </div>

        <Space direction="vertical" className="w-full" size="large">
          {!faceRegistered && (
            <Button
              type="primary"
              block
              loading={loading}
              onClick={registerFace}
            >
              Daftarkan Wajah
            </Button>
          )}

          <Button
            type="primary"
            block
            loading={loading}
            onClick={attendWithButton}
          >
            Absen dengan Tombol
          </Button>

          {faceRegistered && (
            <Button
              type="primary"
              block
              loading={loading}
              onClick={attendWithFace}
            >
              Absen dengan Face Recognition
            </Button>
          )}
        </Space>

        <Modal
          title="Kamera"
          open={showCamera}
          onCancel={stopCamera}
          footer={null}
          width={700}
        >
          <div className="text-center">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="border rounded"
              style={{ width: "100%", maxWidth: "640px" }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
        </Modal>
      </Card>
    </div>
  );
}
