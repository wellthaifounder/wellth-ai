-- Create conversations table for Wellbie chat history
CREATE TABLE IF NOT EXISTS public.wellbie_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.wellbie_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.wellbie_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.wellbie_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellbie_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations"
  ON public.wellbie_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON public.wellbie_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON public.wellbie_conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON public.wellbie_conversations
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages from their conversations"
  ON public.wellbie_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wellbie_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON public.wellbie_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wellbie_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their conversations"
  ON public.wellbie_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.wellbie_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_wellbie_conversations_user_id ON public.wellbie_conversations(user_id);
CREATE INDEX idx_wellbie_messages_conversation_id ON public.wellbie_messages(conversation_id);

-- Trigger for updated_at
CREATE TRIGGER update_wellbie_conversations_updated_at
  BEFORE UPDATE ON public.wellbie_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();