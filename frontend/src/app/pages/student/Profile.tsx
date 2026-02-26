// Страница профиля студента с drag-and-drop и GitHub анализом
import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import {
  Upload, Github, Loader2, X, CheckCircle2, FileText,
  Sparkles, Plus, ChevronDown, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { ProgressBar } from '../../components/shared/ProgressBar';
import { SkillBadge } from '../../components/student/SkillBadge';
import { AILoading } from '../../components/shared/LoadingSkeleton';
import { getStudentProfile, saveStudentProfile, analyzeGitHub, uploadResume } from '../../../lib/api';
import { QueryKeys } from '../../../lib/queryClient';
import type { StudentProfile } from '../../../lib/types';

// Доступные навыки для мультиселекта
const AVAILABLE_SKILLS = {
  'Frontend': ['React', 'Vue.js', 'Angular', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Sass', 'Tailwind CSS', 'Next.js', 'Nuxt.js'],
  'Backend': ['Node.js', 'Python', 'FastAPI', 'Django', 'Flask', 'PHP', 'Laravel', 'Java', 'Spring Boot', 'C#', 'Go', 'Ruby'],
  'Database': ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'SQLite'],
  'DevOps': ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'GCP', 'Azure', 'Terraform', 'Linux', 'Nginx'],
  'Data/AI': ['Machine Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'SQL', 'Statistics', 'Spark'],
  'Другое': ['Git', 'REST API', 'GraphQL', 'Microservices', 'Agile/Scrum', 'Testing', 'Jest', 'WebSocket'],
};

const UNIVERSITIES = [
  'Bocconi Milan University', 'NU', 'NUS', 'IITU', 'KBTU',
  'LUISS', 'SDU', 'Sapienza polytechnic', 'INTC', 'Другой вуз',
];

interface ProfileFormValues {
  name: string;
  university: string;
  specialization: string;
  githubUrl: string;
}

export default function StudentProfile() {
  const qClient = useQueryClient();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzingGitHub, setIsAnalyzingGitHub] = useState(false);
  const [githubAnalysisResult, setGithubAnalysisResult] = useState<{ skills: string[]; repos: number } | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>('Frontend');
  const dropRef = useRef<HTMLDivElement>(null);

  // Загрузка профиля
  const { data: profile, isLoading } = useQuery({
    queryKey: QueryKeys.studentProfile,
    queryFn: getStudentProfile,
  });

  // Синхронизируем навыки из профиля после загрузки
  useEffect(() => {
    if (profile?.skills && profile.skills.length > 0) {
      setSelectedSkills(profile.skills);
    }
  }, [profile]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ProfileFormValues>({
    values: {
      name: profile?.name || '',
      university: profile?.university || '',
      specialization: profile?.specialization || '',
      githubUrl: profile?.githubUrl || '',
    },
  });

  const githubUrl = watch('githubUrl');

  // Мутация сохранения профиля
  const { mutate: saveProfile, isPending: isSaving } = useMutation({
    mutationFn: (data: Partial<StudentProfile>) => saveStudentProfile(data),
    onSuccess: () => {
      qClient.invalidateQueries({ queryKey: QueryKeys.studentProfile });
      qClient.invalidateQueries({ queryKey: QueryKeys.studentMatches });
      qClient.invalidateQueries({ queryKey: QueryKeys.studentRecommendations });
      toast.success('Профиль сохранён! AI матчинг обновлён.');
    },
    onError: () => {
      toast.error('Ошибка сохранения профиля. Попробуйте снова.');
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    let finalResumeUrl = profile?.resumeUrl;
    let finalSkills = selectedSkills;

    // Если выбран новый файл резюме — сначала загружаем его
    if (resumeFile) {
      const uploadToast = toast.loading('Анализируем резюме через AI...');
      try {
        const uploadResult = await uploadResume(resumeFile);
        finalResumeUrl = uploadResult.resumeUrl;
        // Объединяем извлечённые навыки с выбранными вручную
        const extracted = [
          ...uploadResult.extractedSkills,
          ...uploadResult.extractedTechnologies
        ];
        const combined = Array.from(new Set([...selectedSkills, ...extracted]));
        setSelectedSkills(combined);
        finalSkills = combined;

        toast.success('Резюме проанализировано!', { id: uploadToast });
      } catch (err) {
        console.error('Upload error:', err);
        toast.error('Ошибка анализа резюме, но профиль будет сохранён', { id: uploadToast });
      }
    }

    saveProfile({
      name: values.name,
      university: values.university,
      specialization: values.specialization,
      githubUrl: values.githubUrl,
      skills: finalSkills,
      resumeUrl: finalResumeUrl,
    });
  };

  // Drag and drop для резюме
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') {
      setResumeFile(file);
      toast.success(`Резюме "${file.name}" загружено`);
    } else {
      toast.error('Поддерживаются только PDF файлы');
    }
  }, []);

  // Анализ GitHub
  const handleAnalyzeGitHub = async () => {
    if (!githubUrl) {
      toast.error('Введите GitHub URL');
      return;
    }
    setIsAnalyzingGitHub(true);
    try {
      const result = await analyzeGitHub(githubUrl);
      setGithubAnalysisResult(result);
      // Добавляем найденные навыки
      const newSkills = result.skills.filter(s => !selectedSkills.includes(s));
      setSelectedSkills(prev => [...prev, ...newSkills]);
      toast.success(`Анализ завершён! Найдено ${result.repos} репозиториев и ${result.skills.length} навыков.`);
    } catch {
      toast.error('Не удалось проанализировать GitHub профиль');
    } finally {
      setIsAnalyzingGitHub(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill],
    );
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills(prev => prev.filter(s => s !== skill));
  };

  // Подсчёт заполненности
  const calculateCompleteness = () => {
    let score = 0;
    const values = watch();
    if (values.name) score += 15;
    if (values.university) score += 15;
    if (values.specialization) score += 15;
    if (selectedSkills.length >= 3) score += 30;
    else if (selectedSkills.length > 0) score += 15;
    if (resumeFile || profile?.resumeUrl) score += 15;
    if (values.githubUrl) score += 10;
    return Math.min(score, 100);
  };

  if (isLoading) {
    return <AILoading message="Загружаем ваш профиль..." />;
  }

  const completeness = calculateCompleteness();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black">Мой профиль</h1>
        <p className="text-muted-foreground mt-1">Чем точнее профиль — тем лучше AI матчинг</p>
      </div>

      {/* Заполненность профиля */}
      <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/10">
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold">Заполненность профиля</p>
              <p className="text-sm text-muted-foreground">Влияет на точность AI матчинга</p>
            </div>
            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{completeness}%</span>
          </div>
          <ProgressBar value={completeness} size="lg" />
          {completeness < 100 && (
            <p className="text-xs text-muted-foreground mt-2">
              💡 Добавьте {completeness < 30 ? 'основные данные' : completeness < 60 ? 'навыки' : completeness < 85 ? 'резюме' : 'GitHub'} для максимального матчинга
            </p>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Основная информация */}
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold">Основная информация</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Полное имя *</Label>
                <Input
                  placeholder="Иван Петров"
                  {...register('name', { required: 'Обязательное поле' })}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Университет *</Label>
                <Input
                  placeholder="МГТУ им. Баумана"
                  list="universities"
                  {...register('university', { required: 'Обязательное поле' })}
                  className={errors.university ? 'border-destructive' : ''}
                />
                <datalist id="universities">
                  {UNIVERSITIES.map(u => <option key={u} value={u} />)}
                </datalist>
                {errors.university && <p className="text-destructive text-xs">{errors.university.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Специальность *</Label>
              <Input
                placeholder="Программная инженерия"
                {...register('specialization', { required: 'Обязательное поле' })}
                className={errors.specialization ? 'border-destructive' : ''}
              />
              {errors.specialization && <p className="text-destructive text-xs">{errors.specialization.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Навыки */}
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold">Навыки и технологии</h3>
            <p className="text-sm text-muted-foreground">Выберите навыки — AI использует их для матчинга вакансий</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Выбранные навыки */}
            {selectedSkills.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Выбранные навыки ({selectedSkills.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSkills.map(skill => (
                    <SkillBadge
                      key={skill}
                      skill={skill}
                      variant="matching"
                      onRemove={() => removeSkill(skill)}
                    />
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Категории навыков */}
            <div className="space-y-2">
              {Object.entries(AVAILABLE_SKILLS).map(([category, skills]) => (
                <div key={category} className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenCategory(openCategory === category ? null : category)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/50 hover:bg-muted transition-colors text-sm font-medium"
                  >
                    <span>{category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {skills.filter(s => selectedSkills.includes(s)).length}/{skills.length}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${openCategory === category ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>
                  {openCategory === category && (
                    <div className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {skills.map(skill => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className={`px-3 py-1 rounded-full text-sm border transition-all ${selectedSkills.includes(skill)
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'border-border text-muted-foreground hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-foreground'
                              }`}
                          >
                            {selectedSkills.includes(skill) ? '✓ ' : '+ '}{skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* GitHub */}
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Github className="w-5 h-5" /> GitHub анализ
            </h3>
            <p className="text-sm text-muted-foreground">AI анализирует ваши репозитории и автоматически определяет навыки</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="github.com/username"
                {...register('githubUrl')}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAnalyzeGitHub}
                disabled={isAnalyzingGitHub || !githubUrl}
                className="gap-2 flex-shrink-0"
              >
                {isAnalyzingGitHub ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Анализ...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Подключить
                  </>
                )}
              </Button>
            </div>

            {isAnalyzingGitHub && (
              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 p-4 border border-indigo-200 dark:border-indigo-800">
                <AILoading message="AI анализирует ваши репозитории..." />
              </div>
            )}

            {githubAnalysisResult && !isAnalyzingGitHub && (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-4 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    GitHub проанализирован!
                  </p>
                </div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Найдено репозиториев: {githubAnalysisResult.repos} ·
                  Определено навыков: {githubAnalysisResult.skills.length}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {githubAnalysisResult.skills.map(s => (
                    <SkillBadge key={s} skill={s} variant="matching" />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Загрузка резюме */}
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold">Резюме (PDF)</h3>
            <p className="text-sm text-muted-foreground">Загрузите резюме для отправки работодателям</p>
          </CardHeader>
          <CardContent>
            <div
              ref={dropRef}
              onDragEnter={handleDragEnter}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                : 'border-border hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
            >
              {resumeFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-6 h-6 text-indigo-600" />
                  <div className="text-left">
                    <p className="font-medium text-sm">{resumeFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResumeFile(null)}
                    className="ml-2 text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : profile?.resumeUrl ? (
                <div className="flex items-center justify-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Резюме загружено</span>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-medium text-sm">Перетащите PDF файл сюда</p>
                  <p className="text-xs text-muted-foreground mt-1">или</p>
                  <label className="mt-2 inline-block cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setResumeFile(file);
                          toast.success(`Файл "${file.name}" выбран`);
                        }
                      }}
                    />
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                      Выбрать файл
                    </span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">Только PDF, макс. 10 МБ</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Кнопка сохранения */}
        <Button
          type="submit"
          disabled={isSaving}
          className="w-full h-12 text-base bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold gap-2"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSaving ? 'Сохранение...' : '💾 Сохранить профиль и обновить AI матчинг'}
        </Button>
      </form>
    </div>
  );
}