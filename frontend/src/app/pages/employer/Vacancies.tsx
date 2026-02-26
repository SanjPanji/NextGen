// Страница вакансий работодателя
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { VacancyCard } from '../../components/employer/VacancyCard';
import { Skeleton } from '../../components/ui/skeleton';
import { getEmployerVacancies, createVacancy } from '../../../lib/api';
import { QueryKeys } from '../../../lib/queryClient';
import type { Vacancy } from '../../../lib/types';

interface VacancyFormValues {
  title: string;
  description: string;
  requiredSkillsRaw: string;
  salary: string;
  location: string;
  employmentType: string;
}

export default function EmployerVacancies() {
  const qClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: vacancies, isLoading } = useQuery({
    queryKey: QueryKeys.employerVacancies,
    queryFn: getEmployerVacancies,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VacancyFormValues>({
    defaultValues: {
      title: '',
      description: '',
      requiredSkillsRaw: '',
      salary: '',
      location: '',
      employmentType: 'Полная занятость',
    },
  });

  const { mutate: addVacancy, isPending: isCreating } = useMutation({
    mutationFn: (data: Omit<Vacancy, 'id' | 'company' | 'createdAt' | 'candidatesCount' | 'status'>) =>
      createVacancy(data),
    onSuccess: () => {
      qClient.invalidateQueries({ queryKey: QueryKeys.employerVacancies });
      qClient.invalidateQueries({ queryKey: QueryKeys.employerDashboardStats });
      setIsCreateOpen(false);
      reset();
      toast.success('Вакансия успешно создана!');
    },
    onError: () => {
      toast.error('Ошибка создания вакансии');
    },
  });

  const onSubmit = (values: VacancyFormValues) => {
    const skills = values.requiredSkillsRaw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    addVacancy({
      title: values.title,
      description: values.description,
      requiredSkills: skills,
      salary: values.salary,
      location: values.location,
      employmentType: values.employmentType,
    });
  };

  const filtered = (vacancies || []).filter(v =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.company.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Мои вакансии</h1>
          <p className="text-muted-foreground mt-1">
            Управляйте вакансиями и просматривайте AI-подобранных кандидатов
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Добавить вакансию
        </Button>
      </div>

      {/* Поиск */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Поиск вакансий..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 max-w-md"
        />
      </div>

      {/* Список вакансий */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-5 space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-full" />
              <div className="flex gap-2">
                {[1, 2, 3].map(j => <Skeleton key={j} className="h-6 w-20 rounded-full" />)}
              </div>
              <Skeleton className="h-8 w-full rounded-lg" />
            </Card>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map(vacancy => (
            <VacancyCard key={vacancy.id} vacancy={vacancy} />
          ))}
        </div>
      ) : vacancies && vacancies.length > 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Нет вакансий по запросу «{searchQuery}»</p>
          <Button variant="outline" size="sm" onClick={() => setSearchQuery('')} className="mt-3">
            Сбросить поиск
          </Button>
        </div>
      ) : (
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center mx-auto">
            <Plus className="w-8 h-8 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold">Создайте первую вакансию</h3>
            <p className="text-muted-foreground text-sm mt-1">
              AI автоматически подберёт лучших кандидатов
            </p>
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-gradient-to-r from-violet-500 to-purple-600 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Создать вакансию
          </Button>
        </div>
      )}

      {/* Диалог создания вакансии */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Новая вакансия</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Название должности *</Label>
              <Input
                placeholder="Senior Frontend Developer"
                {...register('title', { required: 'Обязательное поле' })}
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Описание *</Label>
              <Textarea
                placeholder="Опишите обязанности, требования и условия работы..."
                rows={3}
                {...register('description', { required: 'Обязательное поле' })}
                className={errors.description ? 'border-destructive' : ''}
              />
              {errors.description && <p className="text-destructive text-xs">{errors.description.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Требуемые навыки (через запятую) *</Label>
              <Input
                placeholder="React, TypeScript, Node.js, Docker"
                {...register('requiredSkillsRaw', { required: 'Обязательное поле' })}
                className={errors.requiredSkillsRaw ? 'border-destructive' : ''}
              />
              {errors.requiredSkillsRaw && <p className="text-destructive text-xs">{errors.requiredSkillsRaw.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Зарплата</Label>
                <Input
                  placeholder="150,000 – 250,000 ₽/мес"
                  {...register('salary')}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Локация *</Label>
                <Input
                  placeholder="Москва / Удалённо"
                  {...register('location', { required: 'Обязательное поле' })}
                  className={errors.location ? 'border-destructive' : ''}
                />
                {errors.location && <p className="text-destructive text-xs">{errors.location.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Тип занятости</Label>
              <select
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                {...register('employmentType')}
              >
                <option>Полная занятость</option>
                <option>Частичная занятость</option>
                <option>Удалённая работа</option>
                <option>Стажировка</option>
                <option>Контракт</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCreateOpen(false)}>
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white gap-2"
              >
                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                {isCreating ? 'Создание...' : 'Создать вакансию'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}