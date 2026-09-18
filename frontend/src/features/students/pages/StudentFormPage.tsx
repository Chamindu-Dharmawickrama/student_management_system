import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { AlertCircle, User, Users, BookOpen } from "lucide-react";

import {
  PageHeader,
  Button,
  Card,
  Input,
  Select,
  Combobox,
  MultiSelect,
  Alert,
  Spinner,
} from "@/shared/components/ui";
import { useSelectedAcademicYear } from "@/features/academicYear/hooks/useSelectedAcademicYear";
import { ROUTES } from "@/constants/app.constants";
import { getErrorMessage, type SerializedApiError } from "@/types/api.types";
import {
  createStudentSchema,
  updateStudentSchema,
  type CreateStudentFormValues,
  type UpdateStudentFormValues,
} from "../validation/student.schemas";
import { PageContainer } from "@/shared/components/layout";
import {
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useGetStudentByIdQuery,
} from "../api/studentApi";
import { useGetClassesQuery } from "@/features/classes/api/classesApi";
import { useGetSubjectsQuery } from "@/features/subjects/api/subjectsApi";

export default function StudentFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { year: selectedYear, yearId: currentYearId, isReadOnly, isLoading: isYearLoading } = useSelectedAcademicYear();

  // Prevent navigation if in read-only mode for edit
  useEffect(() => {
    if (isEdit && isReadOnly) {
      toast.error("Cannot edit in a past academic year");
      navigate(ROUTES.ADMIN_STUDENTS);
    }
  }, [isEdit, isReadOnly, navigate]);

  const { data: studentData, isLoading: isLoadingStudent } = useGetStudentByIdQuery(id!, {
    skip: !isEdit,
  });

  const [createStudent, { isLoading: isCreating }] = useCreateStudentMutation();
  const [updateStudent, { isLoading: isUpdating }] = useUpdateStudentMutation();
  const isSubmitting = isCreating || isUpdating;

  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setError,
    formState: { errors, isDirty },
  } = useForm<CreateStudentFormValues | UpdateStudentFormValues>({
    resolver: zodResolver(isEdit ? updateStudentSchema : createStudentSchema),
    defaultValues: {
      academicYearId: currentYearId ?? "",
      subjectIds: [],
    },
  });

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Load existing data
  useEffect(() => {
    if (isEdit && studentData?.data) {
      const s = studentData.data;
      reset({
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        admissionNumber: s.admissionNumber,
        dateOfBirth: new Date(s.dateOfBirth).toISOString().split("T")[0],
        gender: s.gender,
        guardianName: s.guardianName ?? "",
        guardianPhone: s.guardianPhone ?? "",
        academicYearId: s.currentClass?.academicYear.id ?? "",
        classId: s.currentClass?.id ?? "",
      });
    }
  }, [isEdit, studentData, reset]);

  // Pre-fill academic year for new students if available
  useEffect(() => {
    if (!isEdit && selectedYear) {
      reset((prev) => ({ ...prev, academicYearId: selectedYear.id }));
    }
  }, [isEdit, selectedYear, reset]);

  // Data for Comboboxes/MultiSelects
  const { data: classesData, isLoading: isLoadingClasses } = useGetClassesQuery(
    { page: 1, limit: 100, academicYearId: currentYearId || undefined },
    { skip: !currentYearId }
  );

  const classOptions = useMemo(() => {
    if (!classesData?.data) return [];
    return classesData.data.map((c) => ({ label: c.name, value: c.id }));
  }, [classesData]);

  const { data: subjectsData, isLoading: isLoadingSubjects } = useGetSubjectsQuery(
    { page: 1, limit: 100, status: "active" },
    { skip: isEdit }
  );

  const subjectOptions = useMemo(() => {
    if (!subjectsData?.data) return [];
    return subjectsData.data.map((s) => ({ label: s.name, value: s.id }));
  }, [subjectsData]);

  const onSubmit = async (data: CreateStudentFormValues | UpdateStudentFormValues) => {
    try {
      if (isEdit) {
        const updateData = { ...data };
        if (updateData.classId === studentData?.data?.currentClass?.id) {
          delete updateData.classId;
          delete updateData.academicYearId;
        }

        if (Object.keys(updateData).length === 0) {
          toast.success("No changes to save");
          navigate(ROUTES.ADMIN_STUDENTS);
          return;
        }

        await updateStudent({ id: id!, data: updateData }).unwrap();
        toast.success("Student updated successfully");
        navigate(ROUTES.ADMIN_STUDENTS);
      } else {
        await createStudent(data as CreateStudentFormValues).unwrap();
        setSuccessEmail((data as CreateStudentFormValues).email);
        reset({ ...data, firstName: "", lastName: "", email: "", admissionNumber: "", dateOfBirth: "", gender: "MALE", guardianName: "", guardianPhone: "", subjectIds: [] });
      }
    } catch (error: unknown) {
      const err = error as SerializedApiError;
      if (err.status === 409 && err.data?.message) {
        const msg = err.data.message.toLowerCase();
        if (msg.includes("admission number")) {
          setError("admissionNumber", { type: "manual", message: err.data.message });
          return;
        } else if (msg.includes("email")) {
          setError("email", { type: "manual", message: err.data.message });
          return;
        }
      }
      toast.error(getErrorMessage(error));
    }
  };

  const handleRegisterAnother = () => {
    setSuccessEmail(null);
  };

  if (isYearLoading) {
    return <Spinner fullPage message="Loading academic year..." />;
  }

  if (!currentYearId || !selectedYear) {
    return <Alert variant="warning" title="Warning">Please select an academic year first.</Alert>;
  }

  if (isEdit && isLoadingStudent) {
    return <Spinner fullPage message="Loading student data..." />;
  }

  if (successEmail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="h-16 w-16 rounded-full bg-primary-subtle text-primary flex items-center justify-center mb-2">
          <User className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary">Student Registered</h2>
        <div className="max-w-md p-4 rounded-md bg-success-subtle border border-success/20 text-success-700">
          <p>
            Account created. Login credentials have been emailed to <strong>{successEmail}</strong>.
            They will be asked to set a new password on first sign-in.
          </p>
        </div>
        <div className="flex gap-4 mt-4">
          <Button onClick={handleRegisterAnother}>Register another student</Button>
          <Button variant="secondary" onClick={() => navigate(ROUTES.ADMIN_STUDENTS)}>
            Back to list
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        title={isEdit ? "Edit Student" : "New Student"}
        description={isEdit ? "Update student information" : "Register a new student"}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Personal */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-border-subtle pb-2">
            <User className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-text-primary">Personal Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              {...register("firstName")}
              error={errors.firstName?.message}
              required
            />
            <Input
              label="Last Name"
              {...register("lastName")}
              error={errors.lastName?.message}
              required
            />
            <Input
              type="date"
              label="Date of Birth"
              {...register("dateOfBirth")}
              error={errors.dateOfBirth?.message}
              required
            />
            <Select
              label="Gender"
              {...register("gender")}
              error={errors.gender?.message}
              options={[
                { label: "Male", value: "MALE" },
                { label: "Female", value: "FEMALE" },
                { label: "Other", value: "OTHER" },
              ]}
              required
            />
          </div>
        </Card>

        {/* Section 2: Contact & Guardian */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-border-subtle pb-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-text-primary">Contact & Guardian</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="email"
              label="Email"
              hint="Credentials will be sent to this address."
              {...register("email")}
              error={errors.email?.message}
              required
            />
            <div className="hidden md:block"></div>
            <Input
              label="Guardian Name"
              {...register("guardianName")}
              error={errors.guardianName?.message}
            />
            <Input
              type="tel"
              label="Guardian Phone"
              placeholder="+1234567890"
              {...register("guardianPhone")}
              error={errors.guardianPhone?.message}
            />
          </div>
        </Card>

        {/* Section 3: Enrolment */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-border-subtle pb-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-text-primary">Enrolment</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Admission Number"
              {...register("admissionNumber")}
              error={errors.admissionNumber?.message}
              required
            />
            <Controller
              control={control}
              name="classId"
              render={({ field }) => (
                <Combobox
                  label="Class"
                  options={classOptions}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  error={errors.classId?.message}
                  disabled={isLoadingClasses}
                  placeholder={isLoadingClasses ? "Loading classes..." : "Select class"}
                  required
                />
              )}
            />
            {isEdit && isDirty && watch("classId") !== studentData?.data?.currentClass?.id && (
              <div className="col-span-1 md:col-span-2">
                <Alert
                  variant="warning"
                  title="Warning"
                >
                  Changing the class creates a new enrollment record while preserving the old one in history.
                </Alert>
              </div>
            )}
          </div>
        </Card>

        {/* Section 4: Subjects (Only on creation) */}
        {!isEdit && (
          <Card className="p-6">
            <div className="flex flex-col gap-1 mb-6 border-b border-border-subtle pb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-text-primary">Subjects</h3>
              </div>
              <p className="text-sm text-text-muted flex items-center gap-1.5 mt-1">
                <AlertCircle className="h-4 w-4" />
                These subjects determine which mark sheets are generated for this student and which marks they will receive each term.
              </p>
            </div>
            
            <Controller
              control={control}
              name="subjectIds"
              render={({ field }) => (
                <MultiSelect
                  label="Select Subjects"
                  options={subjectOptions}
                  value={(field.value as string[]) ?? []}
                  onChange={field.onChange}
                  error={(errors as Record<string, { message?: string }>).subjectIds?.message}
                  disabled={isLoadingSubjects}
                  placeholder={isLoadingSubjects ? "Loading subjects..." : "Search subjects..."}
                />
              )}
            />
          </Card>
        )}

        <div className="flex gap-4 justify-end pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(ROUTES.ADMIN_STUDENTS)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEdit ? "Save Changes" : "Register Student"}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
