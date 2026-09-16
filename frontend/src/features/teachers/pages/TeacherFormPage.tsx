import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { User, Users, BookOpen, Trash2 } from "lucide-react";

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
import { useAppSelector } from "@/app/hooks";
import { ROUTES } from "@/constants/app.constants";
import { getErrorMessage, type SerializedApiError } from "@/types/api.types";
import {
  createTeacherSchema,
  updateTeacherSchema,
  type CreateTeacherFormValues,
  type UpdateTeacherFormValues,
} from "../validation/teacher.schemas";
import { PageContainer } from "@/shared/components/layout";
import {
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useGetTeacherByIdQuery,
} from "../api/teacherApi";
import { useGetClassesQuery } from "@/features/classes/api/classesApi";
import { useGetSubjectsQuery } from "@/features/subjects/api/subjectsApi";
import { useGetAcademicYearByIdQuery } from "@/features/academicYear/api/academicYearApi";

export default function TeacherFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { currentYearId, isReadOnly } = useAppSelector((state) => state.academicYear);
  const { data: selectedYear } = useGetAcademicYearByIdQuery(currentYearId!, { skip: !currentYearId });

  // Prevent navigation if in read-only mode for edit
  useEffect(() => {
    if (isEdit && isReadOnly) {
      toast.error("Cannot edit in a past academic year");
      navigate(ROUTES.ADMIN_TEACHERS);
    }
  }, [isEdit, isReadOnly, navigate]);

  const { data: teacherData, isLoading: isLoadingTeacher } = useGetTeacherByIdQuery(id!, {
    skip: !isEdit,
  });

  const [createTeacher, { isLoading: isCreating }] = useCreateTeacherMutation();
  const [updateTeacher, { isLoading: isUpdating }] = useUpdateTeacherMutation();
  const isSubmitting = isCreating || isUpdating;

  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors, isDirty },
  } = useForm<CreateTeacherFormValues | UpdateTeacherFormValues>({
    resolver: zodResolver(isEdit ? updateTeacherSchema : createTeacherSchema),
    defaultValues: {
      classIds: [],
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
    if (isEdit && teacherData?.data && selectedYear) {
      const t = teacherData.data;
      
      const currentSubject = t.currentSubjectAssignment && t.currentSubjectAssignment.academicYear.id === selectedYear.id
        ? t.currentSubjectAssignment.subject.id
        : undefined;
      
      const currentTeachingClasses = t.teachingAssignments
        .filter((ta) => ta.academicYear.id === selectedYear.id)
        .map((ta) => ta.class.id);
        
      const currentClassTeacherRole = t.classTeacherOf
        .find((ct) => ct.academicYear.id === selectedYear.id);

      reset({
        firstName: t.firstName,
        lastName: t.lastName,
        email: t.email,
        employeeNo: t.employeeNo,
        phone: t.phone ?? "",
        gender: t.gender,
        joinDate: t.joinedAt ? new Date(t.joinedAt).toISOString().split("T")[0] : "",
        subjectId: currentSubject,
        classIds: currentTeachingClasses,
        classTeacherOfId: currentClassTeacherRole?.id,
      });
    }
  }, [isEdit, teacherData, selectedYear, reset]);

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
    { page: 1, limit: 100, status: "active" }
  );

  const subjectOptions = useMemo(() => {
    if (!subjectsData?.data) return [];
    return subjectsData.data.map((s) => ({ label: s.name, value: s.id }));
  }, [subjectsData]);

  const onSubmit = async (data: CreateTeacherFormValues | UpdateTeacherFormValues) => {
    try {
      if (isEdit) {
        const updateData = { ...data };
        
        if (Object.keys(updateData).length === 0) {
          toast.success("No changes to save");
          navigate(ROUTES.ADMIN_TEACHERS);
          return;
        }

        await updateTeacher({ id: id!, data: updateData }).unwrap();
        toast.success("Teacher updated successfully");
        navigate(ROUTES.ADMIN_TEACHERS);
      } else {
        await createTeacher(data as CreateTeacherFormValues).unwrap();
        setSuccessEmail((data as CreateTeacherFormValues).email);
        reset({ ...data, firstName: "", lastName: "", email: "", employeeNo: "", phone: "", gender: "MALE", joinDate: "", classIds: [], classTeacherOfId: undefined, subjectId: undefined });
      }
    } catch (error: unknown) {
      const err = error as SerializedApiError;
      if (err.status === 409 && err.data?.message) {
        const msg = err.data.message.toLowerCase();
        if (msg.includes("employee no") || msg.includes("employee number")) {
          setError("employeeNo", { type: "manual", message: err.data.message });
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

  if (!currentYearId || !selectedYear) {
    return <Alert variant="warning" title="Warning">Please select an academic year first.</Alert>;
  }

  if (isEdit && isLoadingTeacher) {
    return <Spinner fullPage message="Loading teacher data..." />;
  }

  if (successEmail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="h-16 w-16 rounded-full bg-primary-subtle text-primary flex items-center justify-center mb-2">
          <User className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary">Teacher Registered</h2>
        <div className="max-w-md p-4 rounded-md bg-success-subtle border border-success/20 text-success-700">
          <p>
            Account created. Login credentials have been emailed to <strong>{successEmail}</strong>.
            They will be asked to set a new password on first sign-in.
          </p>
        </div>
        <div className="flex gap-4 mt-4">
          <Button onClick={handleRegisterAnother}>Register another teacher</Button>
          <Button variant="secondary" onClick={() => navigate(ROUTES.ADMIN_TEACHERS)}>
            Back to list
          </Button>
        </div>
      </div>
    );
  }

  const subjectChanged = isEdit && isDirty && watch("subjectId") !== (teacherData?.data?.currentSubjectAssignment?.subject?.id);
  const classTeacherOfId = watch("classTeacherOfId");

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        title={isEdit ? "Edit Teacher" : "New Teacher"}
        description={isEdit ? "Update teacher information" : "Register a new teacher"}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Personal & Contact */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-border-subtle pb-2">
            <User className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-text-primary">Personal & Contact Details</h3>
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
              type="email"
              label="Email"
              hint={!isEdit ? "Credentials will be sent to this address." : undefined}
              {...register("email")}
              error={errors.email?.message}
              required
            />
            <Input
              label="Employee Number"
              {...register("employeeNo")}
              error={errors.employeeNo?.message}
              required
            />
            <Input
              type="tel"
              label="Phone"
              placeholder="+1234567890"
              {...register("phone")}
              error={errors.phone?.message}
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
            <Input
              type="date"
              label="Join Date"
              {...register("joinDate")}
              error={errors.joinDate?.message}
              required
            />
          </div>
        </Card>

        {/* Section 2: Teaching Assignments */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-border-subtle pb-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-text-primary">Teaching Assignments</h3>
          </div>
          
          <Alert
            variant="info"
            title="Info"
            className="mb-6"
          >
            A teacher teaches one subject per academic year. The classes they are assigned to teach will grant them mark-entry permissions for those classes.
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <Controller
                control={control}
                name="subjectId"
                render={({ field }) => (
                  <Combobox
                    label="Subject"
                    options={subjectOptions}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    error={errors.subjectId?.message}
                    disabled={isLoadingSubjects}
                    placeholder={isLoadingSubjects ? "Loading subjects..." : "Select subject"}
                    required={!isEdit}
                  />
                )}
              />
              {subjectChanged && (
                <Alert
                  variant="warning"
                  title="Warning"
                >
                  Changing the subject mid-year will affect existing assignments for this academic year.
                </Alert>
              )}
            </div>

            <Controller
              control={control}
              name="classIds"
              render={({ field }) => (
                <MultiSelect
                  label="Classes (Mark Entry)"
                  hint="Select the classes they teach this subject to."
                  options={classOptions}
                  value={(field.value as string[]) ?? []}
                  onChange={field.onChange}
                  error={errors.classIds?.message}
                  disabled={isLoadingClasses}
                  placeholder={isLoadingClasses ? "Loading classes..." : "Select classes..."}
                />
              )}
            />
          </div>
        </Card>

        {/* Section 3: Pastoral Care */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-border-subtle pb-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-text-primary">Pastoral Care</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Controller
                control={control}
                name="classTeacherOfId"
                render={({ field }) => (
                  <Combobox
                    label="Class Teacher Responsibility"
                    options={classOptions}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    error={errors.classTeacherOfId?.message}
                    disabled={isLoadingClasses}
                    placeholder={isLoadingClasses ? "Loading classes..." : "Select a class"}
                  />
                )}
              />
              <p className="text-xs text-text-muted mt-1">
                Grants read access to this class's students. Does <strong>not</strong> grant mark-entry rights.
              </p>
              
              {isEdit && (
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={classTeacherOfId === null}
                    onClick={() => {
                      setValue("classTeacherOfId", null, { shouldDirty: true });
                    }}
                    leftIcon={<Trash2 className="h-4 w-4 text-danger" />}
                  >
                    Remove responsibility
                  </Button>
                  <p className="text-xs text-text-muted mt-2 max-w-sm">
                    Use this button to explicitly revoke their class teacher role. Leaving the dropdown untouched makes no changes.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="flex gap-4 justify-end pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(ROUTES.ADMIN_TEACHERS)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEdit ? "Save Changes" : "Register Teacher"}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
