-- Migration: Extend receipt_ocr_data table for enhanced metadata extraction
-- Purpose: Store AI-extracted bill metadata with confidence scores for upload workflow
-- Date: 2026-01-09

-- Add new columns to receipt_ocr_data for enhanced metadata
ALTER TABLE receipt_ocr_data
  ADD COLUMN IF NOT EXISTS extracted_invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS extracted_insurance TEXT,
  ADD COLUMN IF NOT EXISTS extracted_service_date DATE,
  ADD COLUMN IF NOT EXISTS extracted_bill_date DATE,
  ADD COLUMN IF NOT EXISTS extraction_warnings JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS metadata_confidence NUMERIC(3,2) CHECK (metadata_confidence >= 0 AND metadata_confidence <= 1),
  ADD COLUMN IF NOT EXISTS metadata_full JSONB;

-- Add comments to document the new columns
COMMENT ON COLUMN receipt_ocr_data.extracted_invoice_number IS 'Bill/invoice/account number extracted from receipt';
COMMENT ON COLUMN receipt_ocr_data.extracted_insurance IS 'Insurance company name extracted from receipt';
COMMENT ON COLUMN receipt_ocr_data.extracted_service_date IS 'Date services were rendered (not bill date)';
COMMENT ON COLUMN receipt_ocr_data.extracted_bill_date IS 'Date bill was issued/statement date';
COMMENT ON COLUMN receipt_ocr_data.extraction_warnings IS 'Array of warning messages from metadata extraction (e.g., low confidence fields)';
COMMENT ON COLUMN receipt_ocr_data.metadata_confidence IS 'Overall confidence score for metadata extraction (0.0-1.0)';
COMMENT ON COLUMN receipt_ocr_data.metadata_full IS 'Full metadata extraction result with per-field confidence scores from AI';

-- Update the table comment
COMMENT ON TABLE receipt_ocr_data IS 'Stores OCR and AI-extracted data from receipts and bills. Updated 2026-01-09 to include enhanced metadata extraction with confidence scoring.';

-- Create index on metadata_confidence for filtering low-confidence extractions
CREATE INDEX IF NOT EXISTS idx_receipt_ocr_metadata_confidence
  ON receipt_ocr_data(metadata_confidence)
  WHERE metadata_confidence IS NOT NULL;

-- Create index on extracted_service_date for date-based queries
CREATE INDEX IF NOT EXISTS idx_receipt_ocr_service_date
  ON receipt_ocr_data(extracted_service_date)
  WHERE extracted_service_date IS NOT NULL;
