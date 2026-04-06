export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  emergencyContacts: EmergencyContact[];
  language: 'en' | 'hi';
  createdAt: any;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  type: 'alert' | 'warning' | 'info' | 'kidnapping' | 'harassment' | 'suspicious' | 'safe';
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  timestamp: any;
  anonymous: boolean;
  userId?: string;
  userName?: string;
  likes: number;
  comments: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
