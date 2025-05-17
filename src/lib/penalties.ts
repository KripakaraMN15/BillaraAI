import { Invoice } from '../types';
import { differenceInDays, startOfDay, isAfter, parseISO } from 'date-fns';

export function calculatePenalty(invoice: Invoice): { 
  penaltyAmount: number; 
  totalAmount: number; 
  isOverdue: boolean;
  daysOverdue: number;
} {
  if (invoice.status === 'Paid' || !invoice.dueDate) {
    return { 
      penaltyAmount: invoice.penaltyAmount || 0, 
      totalAmount: invoice.totalAmount, 
      isOverdue: false,
      daysOverdue: 0
    };
  }

  const dueDate = startOfDay(parseISO(invoice.dueDate));
  const today = startOfDay(new Date());
  
  if (!isAfter(today, dueDate)) {
    return { 
      penaltyAmount: 0, 
      totalAmount: invoice.baseAmount || invoice.totalAmount, 
      isOverdue: false,
      daysOverdue: 0
    };
  }

  const daysOverdue = differenceInDays(today, dueDate);
  const baseAmount = invoice.baseAmount || invoice.totalAmount;
  const penaltyPerDay = baseAmount * 0.10; // 10% penalty
  const totalPenalty = daysOverdue * penaltyPerDay;

  return {
    penaltyAmount: totalPenalty,
    totalAmount: baseAmount + totalPenalty,
    isOverdue: true,
    daysOverdue
  };
}
