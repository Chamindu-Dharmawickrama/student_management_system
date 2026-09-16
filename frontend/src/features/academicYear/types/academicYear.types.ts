// The light list-item DTO returned by GET /academic-years — no `terms`,
// `createdAt`, or `updatedAt` (those only exist on the detail DTO).
export interface AcademicYearListItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}
