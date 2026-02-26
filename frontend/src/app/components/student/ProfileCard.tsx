// Карточка студента для отображения публичного профиля
import { GraduationCap, Github, FileText, Building2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { ProgressBar } from '../shared/ProgressBar';
import { SkillBadge } from './SkillBadge';
import type { StudentProfile } from '../../../lib/types';

interface ProfileCardProps {
    profile: StudentProfile;
    /** Показывать ли кнопку "Связаться" */
    showContact?: boolean;
    onContact?: () => void;
}

/**
 * Компонент карточки профиля студента.
 * Используется в: список кандидатов для работодателя, страница профиля.
 * Показывает: имя, университет, специальность, навыки, % заполненности, GitHub.
 */
export function ProfileCard({ profile, showContact = false, onContact }: ProfileCardProps) {
    return (
        <Card className="hover:shadow-md transition-all duration-300 overflow-hidden group">
            {/* Шапка с градиентом */}
            <div className="h-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600" />

            <CardContent className="pt-5 pb-5 space-y-4">
                {/* Основная информация */}
                <div className="flex items-start justify-between gap-3">
                    {/* Аватар-инициалы */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="text-white font-black text-base">
                                {profile.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase()}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-base truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {profile.name}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate">{profile.specialization}</p>
                        </div>
                    </div>

                    {/* Заполненность профиля */}
                    <div className="text-right flex-shrink-0">
                        <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                            {profile.profileCompleteness}%
                        </span>
                        <p className="text-[10px] text-muted-foreground">профиль</p>
                    </div>
                </div>

                {/* Университет */}
                {profile.university && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GraduationCap className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{profile.university}</span>
                    </div>
                )}

                {/* Прогресс-бар заполненности */}
                <ProgressBar value={profile.profileCompleteness} size="sm" />

                {/* Навыки */}
                {profile.skills && profile.skills.length > 0 && (
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                            Навыки ({profile.skills.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {profile.skills.slice(0, 8).map((skill) => (
                                <SkillBadge key={skill} skill={skill} variant="default" />
                            ))}
                            {profile.skills.length > 8 && (
                                <span className="text-xs text-muted-foreground self-center">
                                    +{profile.skills.length - 8} ещё
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Ссылки */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {profile.githubUrl && (
                        <a
                            href={`https://${profile.githubUrl.replace(/^https?:\/\//, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Github className="w-3.5 h-3.5" />
                            <span>GitHub</span>
                        </a>
                    )}
                    {profile.resumeUrl && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <FileText className="w-3.5 h-3.5" />
                            <span>Резюме</span>
                        </span>
                    )}
                </div>

                {/* Кнопка "Связаться" (опционально) */}
                {showContact && (
                    <button
                        onClick={onContact}
                        className="w-full mt-2 py-2 px-4 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold transition-all"
                    >
                        Связаться
                    </button>
                )}
            </CardContent>
        </Card>
    );
}
