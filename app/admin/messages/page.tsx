import React from 'react';
import prisma from '@/lib/prisma';
import { Mail, Phone, Building, Clock, CheckCircle } from 'lucide-react';

export const revalidate = 0;

export default async function AdminMessagesPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', marginBottom: '0.4rem' }}>
          صندوق رسائل واستفسارات التواصل
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          متابعة استفسارات الجهات والمؤسسات والرد عليها
        </span>
      </div>

      <div className="card">
        {messages.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            لا توجد رسائل جديدة.
          </p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>المرسل</th>
                  <th>المؤسسة</th>
                  <th>الموضوع</th>
                  <th>الرسالة</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr key={msg.id}>
                    <td>
                      <strong style={{ display: 'block', color: '#FFF' }}>{msg.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{msg.email}</span>
                      {msg.phone && <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', display: 'block' }}>{msg.phone}</span>}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{msg.organization || 'فرد / غير محدد'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-gold-light)', fontSize: '0.9rem' }}>
                      {msg.subject}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '300px' }}>
                      {msg.message}
                    </td>
                    <td>
                      <span className={`badge ${msg.status === 'UNREAD' ? 'badge-yellow' : 'badge-green'}`}>
                        {msg.status === 'UNREAD' ? 'غير مقروءة' : 'تمت المراجعة'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(msg.createdAt).toLocaleDateString('ar-YE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
