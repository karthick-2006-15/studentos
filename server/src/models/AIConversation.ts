import mongoose, { Document, Schema } from 'mongoose';

export interface IAIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: Array<{
    toolName: string;
    args: any;
    result?: any;
    status: 'pending' | 'executed' | 'rejected' | 'failed';
  }>;
  timestamp: Date;
}

export interface IAIConversation extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: IAIMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const AIConversationSchema = new Schema<IAIConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'New Conversation' },
    messages: [
      {
        id: { type: String, required: true },
        role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
        content: { type: String, required: true },
        toolCalls: [{ type: Schema.Types.Mixed }],
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const AIConversation = mongoose.model<IAIConversation>('AIConversation', AIConversationSchema);
