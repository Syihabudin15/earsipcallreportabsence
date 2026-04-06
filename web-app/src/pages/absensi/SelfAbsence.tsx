import { Button, Card, Modal, Space, Typography, App, Tag } from "antd";
import { useEffect, useRef, useState } from "react";
import useContext from "../../libs/context";
import api from "../../libs/api";
import * as faceapi from "face-api.js";
import { Clock, LogOut } from "lucide-react";

const { Title, Text } = Typography;

export default function SelfAbsence() {
  const { message } = App.useApp();
  const { user, modal } = useContext((state: any) => state);

  // State management
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [absenceMethod, setAbsenceMethod] = useState<string>(""); // FACE or BUTTON from DB
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    // Initialize: Load user's attendance method and check today's status
    const initializeAttendance = async () => {
      try {
        setInitialLoading(true);

        // Check user's face registration and fetch today's attendance status
        if (user?.face) {
          setFaceRegistered(true);
        }

        // Fetch today's attendance status
        const response = await api.request({
          url: `${import.meta.env.VITE_API_URL}/absence/self/today`,
          method: "GET",
        });

        if (response?.data?.data) {
          const {
            user: userData,
            attendance,
            checked_in,
            checked_out,
          } = response.data.data;

          // Set the user's preferred absence method
          if (userData?.absen_method) {
            setAbsenceMethod(userData.absen_method);
          }

          // Set attendance status
          setCheckedIn(checked_in);
          setCheckedOut(checked_out);
          setTodayAttendance(attendance);
        }
      } catch (error) {
        console.error("Error initializing attendance:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    initializeAttendance();

    // Load face-api models from local public folder
    const loadModels = async () => {
      try {
        const localModelUrl = "/models/";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(localModelUrl),
          faceapi.nets.faceLandmark68Net.loadFromUri(localModelUrl),
          faceapi.nets.faceRecognitionNet.loadFromUri(localModelUrl),
        ]);
        setModelsLoaded(true);
        console.log("Face models loaded successfully from local storage");
      } catch (error) {
        console.warn(
          "Face recognition models could not be loaded. CORS or network issue detected.",
          error,
        );
        setModelsLoaded(false);
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
      setTimeout(async () => {
        const faceDescriptor = await captureFace();
        if (faceDescriptor) {
          const faceData = Array.from(faceDescriptor);

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

  const attendWithButton = async (type: "CHECK_IN" | "CHECK_OUT") => {
    setLoading(true);
    try {
      const response = await api.request({
        url: `${import.meta.env.VITE_API_URL}/absence/self`,
        method: "POST",
        data: { method: "BUTTON", type },
      });

      if (type === "CHECK_IN") {
        setCheckedIn(true);
        setTodayAttendance(response?.data?.data);
        message.success("Check-in berhasil");
      } else {
        setCheckedOut(true);
        setTodayAttendance(response?.data?.data);
        message.success("Check-out berhasil");
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.msg || "Gagal melakukan absensi";
      message.error(errorMsg);
    }
    setLoading(false);
  };

  const attendWithFace = async (type: "CHECK_IN" | "CHECK_OUT") => {
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
      setTimeout(async () => {
        const faceDescriptor = await captureFace();
        if (faceDescriptor) {
          const storedFace = JSON.parse(user.face);
          const distance = faceapi.euclideanDistance(
            faceDescriptor,
            storedFace,
          );

          if (distance < 0.6) {
            const response = await api.request({
              url: `${import.meta.env.VITE_API_URL}/absence/self`,
              method: "POST",
              data: { method: "FACE", type },
            });

            if (type === "CHECK_IN") {
              setCheckedIn(true);
              setTodayAttendance(response?.data?.data);
              message.success("Check-in dengan face recognition berhasil");
            } else {
              setCheckedOut(true);
              setTodayAttendance(response?.data?.data);
              message.success("Check-out dengan face recognition berhasil");
            }
          } else {
            message.error("Wajah tidak cocok");
          }
        }
        stopCamera();
        setLoading(false);
      }, 2000);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.msg || "Gagal melakukan absensi";
      message.error(errorMsg);
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center">
            <Text>Loading...</Text>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <Title level={2}>Absensi</Title>
          <Text>Selamat datang, {user?.fullname}</Text>
        </div>

        {/* Attendance Status */}
        {checkedIn && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px",
              backgroundColor: "#f6ffed",
              border: "1px solid #b7eb8f",
              borderRadius: "4px",
            }}
          >
            <Text type="success" style={{ fontSize: "12px" }}>
              ✓ Sudah check-in hari ini
              {todayAttendance?.check_in &&
                ` pada ${new Date(todayAttendance.check_in).toLocaleTimeString("id-ID")}`}
            </Text>
          </div>
        )}

        {checkedIn && checkedOut && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px",
              backgroundColor: "#e6f7ff",
              border: "1px solid #91d5ff",
              borderRadius: "4px",
            }}
          >
            <Text type="success" style={{ fontSize: "12px" }}>
              ✓ Sudah check-out hari ini
              {todayAttendance?.check_out &&
                ` pada ${new Date(todayAttendance.check_out).toLocaleTimeString("id-ID")}`}
            </Text>
          </div>
        )}

        {/* Warning when face recognition is disabled */}
        {absenceMethod === "FACE" && !modelsLoaded && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px",
              backgroundColor: "#fff7e6",
              border: "1px solid #ffd591",
              borderRadius: "4px",
            }}
          >
            <Text type="warning" style={{ fontSize: "12px" }}>
              ℹ️ Face recognition is temporarily unavailable. Please use
              button-based attendance.
            </Text>
          </div>
        )}

        {/* Absence Method Tag */}
        {absenceMethod && (
          <div style={{ marginBottom: 16, textAlign: "center" }}>
            <Tag color={absenceMethod === "FACE" ? "blue" : "green"}>
              Metode Absensi:{" "}
              {absenceMethod === "FACE" ? "Face Recognition" : "Tombol"}
            </Tag>
          </div>
        )}

        <Space orientation="vertical" className="w-full" size="large">
          {/* Face Registration - only if method is FACE */}
          {absenceMethod === "FACE" && modelsLoaded && !faceRegistered && (
            <Button
              type="primary"
              block
              loading={loading}
              onClick={registerFace}
            >
              Daftarkan Wajah
            </Button>
          )}

          {/* CHECK-IN Button */}
          {!checkedIn && (
            <>
              {absenceMethod === "FACE" && modelsLoaded && faceRegistered ? (
                <Button
                  type="primary"
                  block
                  loading={loading}
                  onClick={() => attendWithFace("CHECK_IN")}
                  icon={<Clock size={16} />}
                >
                  Check-In (Face Recognition)
                </Button>
              ) : (
                <Button
                  type="primary"
                  block
                  loading={loading}
                  onClick={() => attendWithButton("CHECK_IN")}
                  icon={<Clock size={16} />}
                >
                  Check-In
                </Button>
              )}
            </>
          )}

          {/* CHECK-OUT Button */}
          {checkedIn && !checkedOut && (
            <>
              {absenceMethod === "FACE" && modelsLoaded && faceRegistered ? (
                <Button
                  type="default"
                  block
                  loading={loading}
                  onClick={() => attendWithFace("CHECK_OUT")}
                  icon={<LogOut size={16} />}
                  danger
                >
                  Check-Out (Face Recognition)
                </Button>
              ) : (
                <Button
                  type="default"
                  block
                  loading={loading}
                  onClick={() => attendWithButton("CHECK_OUT")}
                  icon={<LogOut size={16} />}
                  danger
                >
                  Check-Out
                </Button>
              )}
            </>
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
