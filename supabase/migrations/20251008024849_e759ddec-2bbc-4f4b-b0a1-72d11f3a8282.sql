-- Add HSA provider field to reimbursement requests
ALTER TABLE public.reimbursement_requests 
ADD COLUMN hsa_provider TEXT;

-- Update status enum to include more tracking states
COMMENT ON COLUMN public.reimbursement_requests.status IS 'Status values: pending, submitted, approved, paid, rejected';

-- Add submission metadata
ALTER TABLE public.reimbursement_requests
ADD COLUMN submission_method TEXT,
ADD COLUMN submission_email TEXT,
ADD COLUMN pdf_file_path TEXT;