-- CreateIndex
CREATE INDEX `Billing_col_idx` ON `Billing`(`col`);

-- CreateIndex
CREATE INDEX `Billing_periode_idx` ON `Billing`(`periode`);

-- CreateIndex
CREATE INDEX `Billing_bill_status_idx` ON `Billing`(`bill_status`);

-- CreateIndex
CREATE INDEX `CollateralLending_start_at_idx` ON `CollateralLending`(`start_at`);

-- CreateIndex
CREATE INDEX `CollateralLending_end_at_idx` ON `CollateralLending`(`end_at`);

-- CreateIndex
CREATE INDEX `CollateralLending_return_at_idx` ON `CollateralLending`(`return_at`);

-- CreateIndex
CREATE INDEX `CostType_type_idx` ON `CostType`(`type`);

-- CreateIndex
CREATE INDEX `CostType_name_idx` ON `CostType`(`name`);

-- CreateIndex
CREATE INDEX `Debitur_cif_idx` ON `Debitur`(`cif`);

-- CreateIndex
CREATE INDEX `Debitur_nik_idx` ON `Debitur`(`nik`);

-- CreateIndex
CREATE INDEX `Debitur_fullname_idx` ON `Debitur`(`fullname`);

-- CreateIndex
CREATE INDEX `Deduction_name_idx` ON `Deduction`(`name`);

-- CreateIndex
CREATE INDEX `Files_name_idx` ON `Files`(`name`);

-- CreateIndex
CREATE INDEX `Files_url_idx` ON `Files`(`url`);

-- CreateIndex
CREATE INDEX `Insentif_name_idx` ON `Insentif`(`name`);

-- CreateIndex
CREATE INDEX `Insentif_approve_status_idx` ON `Insentif`(`approve_status`);

-- CreateIndex
CREATE INDEX `Insurance_name_idx` ON `Insurance`(`name`);

-- CreateIndex
CREATE INDEX `Insurance_code_idx` ON `Insurance`(`code`);

-- CreateIndex
CREATE INDEX `Mitra_name_idx` ON `Mitra`(`name`);

-- CreateIndex
CREATE INDEX `Mitra_code_idx` ON `Mitra`(`code`);

-- CreateIndex
CREATE INDEX `PayOffice_name_idx` ON `PayOffice`(`name`);

-- CreateIndex
CREATE INDEX `PayOffice_code_idx` ON `PayOffice`(`code`);

-- CreateIndex
CREATE INDEX `PermitAbsence_type_idx` ON `PermitAbsence`(`type`);

-- CreateIndex
CREATE INDEX `PermitAbsence_permit_status_idx` ON `PermitAbsence`(`permit_status`);

-- CreateIndex
CREATE INDEX `PermitFile_action_idx` ON `PermitFile`(`action`);

-- CreateIndex
CREATE INDEX `PermitFile_permit_status_idx` ON `PermitFile`(`permit_status`);

-- CreateIndex
CREATE INDEX `Position_name_idx` ON `Position`(`name`);

-- CreateIndex
CREATE INDEX `Product_name_idx` ON `Product`(`name`);

-- CreateIndex
CREATE INDEX `ProductType_name_idx` ON `ProductType`(`name`);

-- CreateIndex
CREATE INDEX `ProductTypeFile_name_idx` ON `ProductTypeFile`(`name`);

-- CreateIndex
CREATE INDEX `Role_name_idx` ON `Role`(`name`);

-- CreateIndex
CREATE INDEX `Submission_guarantee_status_idx` ON `Submission`(`guarantee_status`);

-- CreateIndex
CREATE INDEX `Submission_doc_status_idx` ON `Submission`(`doc_status`);

-- CreateIndex
CREATE INDEX `Submission_approve_status_idx` ON `Submission`(`approve_status`);

-- CreateIndex
CREATE INDEX `Submission_flagging_status_idx` ON `Submission`(`flagging_status`);

-- CreateIndex
CREATE INDEX `Submission_guarantee_date_idx` ON `Submission`(`guarantee_date`);

-- CreateIndex
CREATE INDEX `Submission_account_number_idx` ON `Submission`(`account_number`);

-- CreateIndex
CREATE INDEX `SubmissionType_name_idx` ON `SubmissionType`(`name`);

-- CreateIndex
CREATE INDEX `User_fullname_idx` ON `User`(`fullname`);

-- CreateIndex
CREATE INDEX `User_nip_idx` ON `User`(`nip`);

-- CreateIndex
CREATE INDEX `Visit_col_idx` ON `Visit`(`col`);

-- CreateIndex
CREATE INDEX `Visit_date_action_idx` ON `Visit`(`date_action`);

-- CreateIndex
CREATE INDEX `Visit_date_plan_idx` ON `Visit`(`date_plan`);

-- CreateIndex
CREATE INDEX `VisitCategory_name_idx` ON `VisitCategory`(`name`);

-- CreateIndex
CREATE INDEX `VisitPurpose_name_idx` ON `VisitPurpose`(`name`);

-- CreateIndex
CREATE INDEX `VisitStatus_name_idx` ON `VisitStatus`(`name`);
