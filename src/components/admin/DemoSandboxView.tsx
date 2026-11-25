import React from 'react';
import {
  CalendarCheck,
  Clock,
  CreditCard,
  FlaskConical,
  Lock,
  MessageCircle,
  Users,
} from 'lucide-react';

export interface SyntheticDemoPayload {
  demoMode: boolean;
  sandboxLabel: string;
  readOnly: boolean;
  todayIst: string;
  shifts: Array<{
    id: string;
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    timingLabel: string;
    description: string;
    active: boolean;
  }>;
  students: Array<{
    id: string;
    studentCode: string;
    fullName: string;
    mobile: string;
    email: string;
    fatherName: string;
    membershipStatus: string;
    membershipPlanName: string;
    seatCode: string;
    shiftId: string;
    shiftName: string;
    shiftTiming: string;
    status: string;
    isDemo: boolean;
  }>;
  attendance: Array<{
    id: string;
    studentCode: string;
    studentName: string;
    shiftName: string;
    date: string;
    recordedAtIst: string;
    status: string;
    leaveReason?: string;
    method: string;
    markedByLabel: string;
  }>;
  payments: Array<{
    id: string;
    receiptNumber: string;
    studentCode: string;
    studentName: string;
    planName: string;
    amount: number;
    method: string;
    status: string;
    paidAt: string;
  }>;
  feeRecords: Array<{
    id: string;
    studentCode: string;
    studentName: string;
    className: string;
    monthlyFee: number;
    totalPaid: number;
    dueAmount: number;
    paymentStatus: string;
    dueDate: string;
  }>;
  kpis: {
    totalStudents: number;
    presentToday: number;
    leaveToday: number;
    absentToday: number;
    monthlyDemoRevenue: number;
    pendingDemoFeeBalance: number;
  };
}

interface DemoSandboxViewProps {
  tab: 'students' | 'attendance' | 'shifts' | 'fee_reminders' | 'finance' | 'analytics';
  data: SyntheticDemoPayload | null;
  loading: boolean;
  onRefresh: () => void;
}

export const DemoSandboxView: React.FC<DemoSandboxViewProps> = ({
  tab,
  data,
  loading,
  onRefresh,
}) => {
  if (loading && !data) {
    return (
      <div className="p-8 text-center rounded-xl bg-surface-container-lowest border border-outline-variant">
        <div className="w-7 h-7 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-on-surface-variant font-medium">
          Loading synthetic demo sandbox dataset...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 rounded-xl bg-error-container text-on-error-container border border-error/30 text-xs flex items-center justify-between gap-3">
        <span>Unable to load synthetic demo dataset.</span>
        <button
          type="button"
          onClick={onRefresh}
          className="px-3 py-1.5 rounded bg-error text-on-error font-semibold cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const headerBadge = (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning-container text-on-warning-container text-[11px] font-bold uppercase tracking-wide border border-warning/40">
      <Lock className="w-3 h-3" /> Read-Only Synthetic Demo
    </span>
  );

  if (tab === 'students') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary" />
              Synthetic Demo Students
            </h2>
            <p className="text-xs text-on-surface-variant">
              Sample student records generated strictly in memory. Real student profiles are hidden and inaccessible in Demo Mode.
            </p>
          </div>
          {headerBadge}
        </div>

        <div className="rounded-lg bg-surface-container-lowest border border-outline-variant overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low uppercase text-on-surface-variant border-b border-outline-variant">
              <tr>
                <th className="px-4 py-3">Demo Code</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Demo Mobile</th>
                <th className="px-4 py-3">Seat</th>
                <th className="px-4 py-3">Shift</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {data.students.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-mono font-bold text-primary">{s.studentCode}</td>
                  <td className="px-4 py-3 font-semibold">{s.fullName}</td>
                  <td className="px-4 py-3 font-mono">{s.mobile}</td>
                  <td className="px-4 py-3 font-mono">{s.seatCode}</td>
                  <td className="px-4 py-3">{s.shiftName}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-success-container text-on-success-container text-[10px] font-bold uppercase">
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (tab === 'attendance') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-secondary" />
              Synthetic Attendance Log ({data.todayIst})
            </h2>
            <p className="text-xs text-on-surface-variant">
              Sample attendance state demonstrating Present / Leave / Absent tracking. Writes are disabled in Demo Mode.
            </p>
          </div>
          {headerBadge}
        </div>

        <div className="rounded-lg bg-surface-container-lowest border border-outline-variant overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low uppercase text-on-surface-variant border-b border-outline-variant">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Shift</th>
                <th className="px-4 py-3">Time (IST)</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {data.attendance.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{a.studentName}</p>
                    <p className="font-mono text-[11px] text-on-surface-variant">{a.studentCode}</p>
                  </td>
                  <td className="px-4 py-3">{a.shiftName}</td>
                  <td className="px-4 py-3 font-mono">{a.recordedAtIst}</td>
                  <td className="px-4 py-3 font-mono">{a.method}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        a.status === 'PRESENT'
                          ? 'bg-success-container text-on-success-container'
                          : 'bg-warning-container text-on-warning-container'
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{a.leaveReason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (tab === 'shifts') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
              <Clock className="w-5 h-5 text-secondary" />
              Synthetic Library Shifts
            </h2>
            <p className="text-xs text-on-surface-variant">
              Read-only preview of sample study shifts for staging demonstrations.
            </p>
          </div>
          {headerBadge}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.shifts.map((shift) => (
            <div
              key={shift.id}
              className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container">
                  {shift.code}
                </span>
                <span className="text-[11px] font-semibold text-success">Active (Demo)</span>
              </div>
              <h3 className="font-headline text-base font-bold text-primary">{shift.name}</h3>
              <p className="font-mono text-xs text-on-surface-variant">{shift.timingLabel}</p>
              <p className="text-xs text-on-surface-variant">{shift.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tab === 'fee_reminders') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-secondary" />
              Synthetic Fee Balances (Read-Only)
            </h2>
            <p className="text-xs text-on-surface-variant">
              Demonstrates monthly fee and due-balance tracking. Real student fee ledgers and WhatsApp dispatches are blocked in Demo Mode.
            </p>
          </div>
          {headerBadge}
        </div>

        <div className="rounded-lg bg-surface-container-lowest border border-outline-variant overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low uppercase text-on-surface-variant border-b border-outline-variant">
              <tr>
                <th className="px-4 py-3">Demo Student</th>
                <th className="px-4 py-3">Batch / Track</th>
                <th className="px-4 py-3">Monthly Fee</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Due Balance</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {data.feeRecords.map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{f.studentName}</p>
                    <p className="font-mono text-[11px] text-on-surface-variant">{f.studentCode}</p>
                  </td>
                  <td className="px-4 py-3">{f.className}</td>
                  <td className="px-4 py-3 font-mono">₹{f.monthlyFee.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 font-mono text-success font-semibold">
                    ₹{f.totalPaid.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 font-mono text-error font-semibold">
                    ₹{f.dueAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        f.paymentStatus === 'paid'
                          ? 'bg-success-container text-on-success-container'
                          : 'bg-warning-container text-on-warning-container'
                      }`}
                    >
                      {f.paymentStatus.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (tab === 'finance') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-secondary" />
              Synthetic Payment Receipts
            </h2>
            <p className="text-xs text-on-surface-variant">
              Sample payment receipts for UI demonstration only. Real payment transactions and Razorpay/cash records are blocked.
            </p>
          </div>
          {headerBadge}
        </div>

        <div className="rounded-lg bg-surface-container-lowest border border-outline-variant overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low uppercase text-on-surface-variant border-b border-outline-variant">
              <tr>
                <th className="px-4 py-3">Receipt #</th>
                <th className="px-4 py-3">Demo Student</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {data.payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-mono font-bold text-primary">{p.receiptNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{p.studentName}</p>
                    <p className="font-mono text-[11px] text-on-surface-variant">{p.studentCode}</p>
                  </td>
                  <td className="px-4 py-3">{p.planName}</td>
                  <td className="px-4 py-3 font-mono font-bold text-success">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 font-mono uppercase">{p.method}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-success-container text-on-success-container text-[10px] font-bold uppercase">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-warning" />
            Synthetic Analytics Summary
          </h2>
          <p className="text-xs text-on-surface-variant">
            Aggregated sample figures computed strictly from synthetic sandbox records.
          </p>
        </div>
        {headerBadge}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant shadow-sm">
          <p className="text-xs text-on-surface-variant font-medium">Demo Present / Registered</p>
          <p className="font-headline text-2xl font-bold text-success mt-1">
            {data.kpis.presentToday} / {data.kpis.totalStudents}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant shadow-sm">
          <p className="text-xs text-on-surface-variant font-medium">Synthetic Monthly Revenue</p>
          <p className="font-headline text-2xl font-bold text-primary mt-1">
            ₹{data.kpis.monthlyDemoRevenue.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant shadow-sm">
          <p className="text-xs text-on-surface-variant font-medium">Synthetic Pending Balance</p>
          <p className="font-headline text-2xl font-bold text-error mt-1">
            ₹{data.kpis.pendingDemoFeeBalance.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  );
};
