import { io, type Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, { autoConnect: true, transports: ['websocket', 'polling'] });
  }
  return socket;
}

export function joinQueueRoom(doctorId: string, branchId: string, appointmentId?: string) {
  const s = getSocket();
  s.emit('queue:join', { doctorId, branchId, appointmentId });
}

export function leaveQueueRoom(doctorId: string, branchId: string) {
  getSocket().emit('queue:leave', { doctorId, branchId });
}

export type QueueState = {
  doctorId: string;
  branchId: string;
  currentPatient: {
    queueNumber: number | null;
    position: number;
    patientName: string | null;
    status: string;
  } | null;
  waitingCount: number;
  entries: {
    id: string;
    position: number;
    queueNumber: number | null;
    status: string;
    estimatedWaitMin: number;
    patientName: string | null;
    appointmentId: string;
  }[];
  avgDurationMin: number;
};
