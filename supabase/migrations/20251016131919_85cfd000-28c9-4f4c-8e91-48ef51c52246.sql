-- Fix email_subscribers public data exposure
-- Add policy to explicitly deny anonymous access to email_subscribers table
CREATE POLICY "Deny public access to email subscribers"
ON email_subscribers
FOR SELECT
TO anon
USING (false);

-- Add missing DELETE policy for reimbursement_items (user experience fix)
CREATE POLICY "Users can delete their own reimbursement items"
ON reimbursement_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM reimbursement_requests
    WHERE reimbursement_requests.id = reimbursement_items.reimbursement_request_id
    AND reimbursement_requests.user_id = auth.uid()
  )
);