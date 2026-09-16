import { useState, type ReactNode } from 'react';
import {
  BookOpen,
  GraduationCap,
  Mail,
  Percent,
  Trash2,
  Users,
} from 'lucide-react';
import {
  Alert,
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Combobox,
  ConfirmDialog,
  DataTable,
  DatePicker,
  DateRangePicker,
  DescriptionList,
  Drawer,
  DropdownMenu,
  EmptyState,
  ErrorState,
  FilterBar,
  Input,
  Modal,
  MultiSelect,
  PageHeader,
  Pagination,
  PasswordInput,
  ProgressBar,
  RadioGroup,
  SearchInput,
  Select,
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonText,
  Spinner,
  StatCard,
  StatusBadge,
  Switch,
  Tabs,
  Textarea,
  Tooltip,
  type Column,
} from '@/shared/components/ui';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { useUrlSyncedTab } from '@/shared/hooks/useUrlSyncedTab';

const CLASS_OPTIONS = [
  { value: 'c1', label: 'Grade 10 - A' },
  { value: 'c2', label: 'Grade 10 - B' },
  { value: 'c3', label: 'Grade 11 - A' },
];

const SUBJECT_OPTIONS = [
  { value: 's1', label: 'Mathematics' },
  { value: 's2', label: 'Science' },
  { value: 's3', label: 'English' },
  { value: 's4', label: 'History' },
];

interface DemoStudent {
  id: string;
  name: string;
  admissionNumber: string;
  className: string;
  mark: number | null;
}

const DEMO_ROWS: DemoStudent[] = [
  { id: '1', name: 'Amara Perera', admissionNumber: 'A0012', className: 'Grade 10 - A', mark: 87 },
  { id: '2', name: 'Nadeesha Silva', admissionNumber: 'A0013', className: 'Grade 10 - A', mark: 54 },
  { id: '3', name: 'Kasun Fernando', admissionNumber: 'A0014', className: 'Grade 10 - B', mark: null },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-8 first:border-t-0 first:pt-0">
      <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ name, varName }: { name: string; varName: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-14 w-full rounded-md border border-border"
        style={{ backgroundColor: `var(${varName})` }}
      />
      <p className="text-xs font-medium text-text-primary">{name}</p>
      <p className="text-xs text-text-muted">{varName}</p>
    </div>
  );
}

export default function DesignSystem() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [comboValue, setComboValue] = useState<string | null>(null);
  const [multiValue, setMultiValue] = useState<string[]>(['s1']);
  const [selectValue, setSelectValue] = useState('c1');
  const [checked, setChecked] = useState(true);
  const [radioValue, setRadioValue] = useState('male');
  const [switchOn, setSwitchOn] = useState(true);
  const [date, setDate] = useState('2026-01-15');
  const [rangeStart, setRangeStart] = useState('2026-01-01');
  const [rangeEnd, setRangeEnd] = useState('2026-03-31');
  const [password, setPassword] = useState('');
  const [remarks, setRemarks] = useState('');
  const [search, setSearch] = useState('');

  const [tab, setTab] = useUrlSyncedTab('overview');

  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc',
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showTableError, setShowTableError] = useState(false);
  const [showTableEmpty, setShowTableEmpty] = useState(false);
  const [showTableLoading, setShowTableLoading] = useState(false);

  const { confirm, dialog } = useConfirm();

  const columns: Column<DemoStudent>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'admissionNumber', header: 'Admission No.', hideOnMobile: true },
    { key: 'className', header: 'Class' },
    {
      key: 'mark',
      header: 'Mark',
      align: 'right',
      render: (row) => (row.mark === null ? '—' : `${row.mark}/100`),
    },
  ];

  async function handleImperativeConfirm() {
    const ok = await confirm({
      title: 'Deactivate class Grade 10 - A?',
      description:
        'This ends all active teaching assignments for this class and clears its class teacher. Students keep their enrollment history.',
      confirmLabel: 'Deactivate class',
      variant: 'danger',
      confirmPhrase: 'Grade 10 - A',
    });
    if (ok) {
      // demo only — no real mutation in the gallery
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6">
      <PageHeader
        title="Design System"
        description="Every component in the shared UI kit, in every variant and state — dev-only gallery for prompt 02."
        breadcrumbs={<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Design System' }]} />}
      />

      <Section title="Colour tokens">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          <Swatch name="Primary" varName="--color-primary" />
          <Swatch name="Primary hover" varName="--color-primary-hover" />
          <Swatch name="Accent" varName="--color-accent" />
          <Swatch name="Success" varName="--color-success" />
          <Swatch name="Warning" varName="--color-warning" />
          <Swatch name="Danger" varName="--color-danger" />
          <Swatch name="Info" varName="--color-info" />
          <Swatch name="Bg app" varName="--color-bg-app" />
          <Swatch name="Bg card" varName="--color-bg-card" />
          <Swatch name="Bg subtle" varName="--color-bg-subtle" />
          <Swatch name="Border" varName="--color-border" />
          <Swatch name="Border strong" varName="--color-border-strong" />
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Add">
            <Users className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button isLoading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button leftIcon={<Mail className="h-4 w-4" aria-hidden="true" />}>With icon</Button>
          <Button fullWidth className="max-w-xs">
            Full width
          </Button>
        </div>
      </Section>

      <Section title="Form primitives">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Input label="Admission number" placeholder="A0012" required hint="School-issued admission ID" />
          <Input label="Guardian email" error="Enter a valid email address" defaultValue="not-an-email" />
          <PasswordInput
            label="New password"
            required
            showStrengthMeter
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Textarea
            label="Remarks"
            maxLength={500}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Teacher remarks for this mark…"
          />
          <Select
            label="Class"
            options={CLASS_OPTIONS}
            value={selectValue}
            onChange={(e) => setSelectValue(e.target.value)}
          />
          <DatePicker label="Date of birth" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Combobox
            label="Class"
            options={CLASS_OPTIONS}
            value={comboValue}
            onChange={setComboValue}
            placeholder="Search classes…"
          />
          <MultiSelect
            label="Subjects"
            options={SUBJECT_OPTIONS}
            value={multiValue}
            onChange={setMultiValue}
            placeholder="Add subjects…"
          />
        </div>
        <DateRangePicker
          label="Exam period"
          startValue={rangeStart}
          endValue={rangeEnd}
          onStartChange={setRangeStart}
          onEndChange={setRangeEnd}
        />
        <div className="flex flex-wrap items-start gap-8">
          <Checkbox
            label="Send credentials by email"
            description="A temporary password will be emailed"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <RadioGroup
            label="Gender"
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ]}
            value={radioValue}
            onChange={setRadioValue}
            orientation="horizontal"
          />
          <Switch
            label="Class teacher"
            description="Grants class-wide read scope"
            checked={switchOn}
            onChange={(e) => setSwitchOn(e.target.checked)}
          />
        </div>
      </Section>

      <Section title="Feedback & status">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="success" dot>
            Success
          </Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="primary">Primary</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge kind="markSheet" status="DRAFT" />
          <StatusBadge kind="markSheet" status="SUBMITTED" />
          <StatusBadge kind="markSheet" status="APPROVED" />
          <StatusBadge kind="markSheet" status="REJECTED" />
          <StatusBadge kind="markSheet" status="LOCKED" />
          <StatusBadge kind="account" status="active" />
          <StatusBadge kind="account" status="inactive" />
          <StatusBadge kind="examPeriod" status="not-configured" />
          <StatusBadge kind="examPeriod" status="upcoming" />
          <StatusBadge kind="examPeriod" status="in-progress" />
          <StatusBadge kind="examPeriod" status="entry-open" />
          <StatusBadge kind="passwordPending" />
        </div>
        <div className="flex flex-col gap-3">
          <Alert variant="info" title="Marks unlock by date">
            Entry opens automatically once the exam's end date has passed.
          </Alert>
          <Alert variant="success" title="Marksheets generated" onDismiss={() => {}} />
          <Alert variant="warning" title="Exam period not configured yet" />
          <Alert
            variant="danger"
            title="Mark entry is closed"
            action={<Button size="sm" variant="outline">View exam</Button>}
          >
            The exam period for Term 2 has not ended yet.
          </Alert>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <Spinner size="sm" />
          <Spinner size="md" message="Loading…" />
          <ProgressBar value={18} max={24} label="Marks entered" className="max-w-xs" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-20 rounded-md" />
          <SkeletonCard />
          <SkeletonText lines={3} />
        </div>
        <SkeletonTable rows={3} columns={4} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <EmptyState
            title="No students yet"
            description="Register a student to see them appear here."
            action={<Button size="sm">Register student</Button>}
          />
          <ErrorState message="Failed to load students." onRetry={() => {}} />
        </div>
      </Section>

      <Section title="Cards, modals & overlays">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Grade 10 - A</CardTitle>
            <CardDescription>32 students · Ms. Perera (class teacher)</CardDescription>
          </CardHeader>
          <CardContent>
            <DescriptionList
              items={[
                { label: 'Grade level', value: '10' },
                { label: 'Academic year', value: '2025/2026' },
              ]}
            />
          </CardContent>
          <CardFooter>
            <Button size="sm" variant="outline">
              View class
            </Button>
          </CardFooter>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setModalOpen(true)}>Open modal</Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Open confirm dialog
          </Button>
          <Button variant="outline" onClick={() => setDrawerOpen(true)}>
            Open drawer
          </Button>
          <Button variant="outline" onClick={handleImperativeConfirm}>
            Imperative useConfirm()
          </Button>
          <Tooltip content="Keyboard-accessible tooltip">
            <Button variant="ghost" size="sm">
              Hover or focus me
            </Button>
          </Tooltip>
          <DropdownMenu
            trigger={<Button variant="outline" size="sm">Row actions</Button>}
            items={[
              { label: 'Edit', onSelect: () => {} },
              { label: 'View subjects', onSelect: () => {}, icon: <BookOpen className="h-4 w-4" aria-hidden="true" /> },
              { label: 'Deactivate', onSelect: () => {}, danger: true, icon: <Trash2 className="h-4 w-4" aria-hidden="true" /> },
            ]}
          />
        </div>

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Edit student"
          description="Update enrollment details for Amara Perera."
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setModalOpen(false)}>Save changes</Button>
            </>
          }
        >
          <p className="text-sm text-text-secondary">
            Modal body content goes here — focus is trapped, Escape closes it, and focus
            returns to the trigger button on close.
          </p>
        </Modal>

        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmLoading(true);
            setTimeout(() => {
              setConfirmLoading(false);
              setConfirmOpen(false);
            }, 800);
          }}
          title="Delete grade band F?"
          description="This grade band will be permanently removed. Marks already using it keep their stored grade."
          confirmLabel="Delete grade band"
          variant="danger"
          isLoading={confirmLoading}
        />

        <Drawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Filter students"
          description="Refine the student list"
        >
          <div className="flex flex-col gap-4">
            <Select label="Status" options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }]} defaultValue="all" />
            <Select label="Class" options={CLASS_OPTIONS} defaultValue="" placeholder="Any class" />
          </div>
        </Drawer>

        {dialog}
      </Section>

      <Section title="Tabs">
        <Tabs
          tabs={[
            { value: 'overview', label: 'Overview', icon: <GraduationCap className="h-4 w-4" aria-hidden="true" /> },
            { value: 'subjects', label: 'Subjects' },
            { value: 'marks', label: 'Marks' },
          ]}
          value={tab}
          onChange={setTab}
        >
          <p className="text-sm text-text-secondary">Active tab: {tab} (synced to the URL's ?tab= param).</p>
        </Tabs>
      </Section>

      <Section title="Data display">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar firstName="Amara" lastName="Perera" />
          <Avatar firstName="Nadeesha" lastName="Silva" size="lg" status="active" />
          <Avatar firstName="Kasun" lastName="Fernando" size="sm" status="inactive" />
          <Avatar photoUrl="https://does-not-exist.invalid/photo.jpg" firstName="Broken" lastName="Image" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total students" value={412} icon={<Users className="h-5 w-5" aria-hidden="true" />} trend={{ value: 4, label: 'vs last term' }} />
          <StatCard label="Average mark" value="78%" icon={<Percent className="h-5 w-5" aria-hidden="true" />} trend={{ value: -2, label: 'vs last term' }} />
          <StatCard label="Classes" value={14} icon={<BookOpen className="h-5 w-5" aria-hidden="true" />} />
        </div>

        <SearchInput value={search} onChange={setSearch} aria-label="Search students" className="max-w-sm" />

        <FilterBar
          chips={[
            { key: 'class', label: 'Class: Grade 10 - A', onRemove: () => {} },
            { key: 'status', label: 'Status: Active', onRemove: () => {} },
          ]}
          onClearAll={() => {}}
        >
          <Select
            label="Status"
            options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }]}
            defaultValue="all"
            className="sm:w-40"
          />
          <Select label="Class" options={CLASS_OPTIONS} defaultValue="" placeholder="Any class" className="sm:w-48" />
        </FilterBar>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowTableLoading((v) => !v)}>
            Toggle loading
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowTableError((v) => !v)}>
            Toggle error
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowTableEmpty((v) => !v)}>
            Toggle empty
          </Button>
        </div>

        <DataTable
          caption="Demo students"
          columns={columns}
          rows={showTableEmpty ? [] : DEMO_ROWS}
          isLoading={showTableLoading}
          error={showTableError ? new Error('Failed to load students') : undefined}
          onRetry={() => setShowTableError(false)}
          getRowId={(row) => row.id}
          sort={sort}
          onSortChange={setSort}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={() => {}}
        />

        <Pagination
          meta={{ page: 1, limit: 20, total: 137, totalPages: 7 }}
          onPageChange={() => {}}
          onPageSizeChange={() => {}}
        />
      </Section>
    </div>
  );
}
