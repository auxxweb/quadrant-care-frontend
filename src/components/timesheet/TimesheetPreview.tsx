import type { Timesheet } from '../../types';
import { OfficialTimesheetForm } from './OfficialTimesheetForm';

export function TimesheetPreview({
  item,
  items,
  hrefFor,
  activeId,
  showReviewDetails = true,
}: {
  item?: Timesheet;
  items?: Timesheet[];
  hrefFor?: (entry: Timesheet) => string;
  activeId?: string;
  showReviewDetails?: boolean;
}) {
  const entries = items?.length ? items : item ? [item] : [];
  return <OfficialTimesheetForm entries={entries} hrefFor={hrefFor} activeId={activeId} showReviewDetails={showReviewDetails} />;
}
