// app/(main)/layout.tsx

// 1. Import AuthProvider (จากไฟล์ที่เราสร้างในขั้นตอนที่แล้ว)
import { AuthProvider } from "../components/AuthWrapper"; // <-- ใช้ Path เดียวกับ Sidebar ครับ
import Sidebar from "../components/sidebar"; 

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 2. หุ้มทุกอย่างด้วย AuthProvider
    <AuthProvider>
      {/* 3. โค้ด Layout เดิมของคุณ (div, Sidebar, main) จะถูกวางไว้ข้างในนี้
        
        AuthWrapper (AuthProvider) จะทำหน้าที่เป็น "ด่านตรวจ":
        - ถ้า Login แล้ว (Authenticated) -> มันจะแสดง <div className="flex..."> นี้ตามปกติ
        - ถ้ายังไม่ Login (Unauthenticated) -> มันจะแสดง <RedirectToLogin /> แทน (ตามที่เราเขียนไว้ใน AuthWrapper)
      */}
      <div className="flex h-screen bg-slate-50"> 
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}