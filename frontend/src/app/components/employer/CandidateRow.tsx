// Строка кандидата в таблице для работодателя
import { Mail, Github, GraduationCap, Star } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { SkillBadge } from '../student/SkillBadge';
import { MatchPercent } from './MatchPercent';
import type { Candidate } from '../../../lib/types';

interface CandidateRowProps {
  candidate: Candidate;
  rank: number;
}

/** Строка кандидата с полной информацией для работодателя */
export function CandidateRow({ candidate, rank }: CandidateRowProps) {
  const initials = candidate.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Градиент аватара на основе ранга
  const gradients = [
    'from-amber-400 to-orange-500',    // 1st
    'from-slate-400 to-gray-500',      // 2nd
    'from-amber-600 to-yellow-700',    // 3rd
    'from-indigo-500 to-violet-600',   // others
  ];
  const gradient = rank <= 3 ? gradients[rank - 1] : gradients[3];

  const handleContact = () => {
    window.open(`mailto:${candidate.email}?subject=Предложение о сотрудничестве — CareerAI`, '_blank');
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all hover:border-indigo-200 dark:hover:border-indigo-800 group">
      {/* Ранг */}
      <div className="w-7 text-center flex-shrink-0">
        {rank <= 3 ? (
          <Star className={`w-4 h-4 mx-auto ${rank === 1 ? 'text-amber-500' : rank === 2 ? 'text-slate-400' : 'text-amber-700'}`} fill="currentColor" />
        ) : (
          <span className="text-sm font-bold text-muted-foreground">{rank}</span>
        )}
      </div>

      {/* Аватар */}
      <Avatar className="w-10 h-10 flex-shrink-0">
        <AvatarFallback className={`bg-gradient-to-br ${gradient} text-white text-sm font-bold`}>
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Инфо о студенте */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate">{candidate.name}</p>
          {candidate.avgGrade && (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex-shrink-0">
              ★ {candidate.avgGrade}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <GraduationCap className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <p className="text-xs text-muted-foreground truncate">{candidate.university}</p>
        </div>
        {candidate.specialization && (
          <p className="text-xs text-muted-foreground/70 truncate">{candidate.specialization}</p>
        )}
      </div>

      {/* % совпадения */}
      <div className="flex-shrink-0">
        <MatchPercent value={candidate.matchPercent} showBar size="sm" />
      </div>

      {/* Недостающие навыки */}
      <div className="hidden md:flex flex-wrap gap-1 max-w-[200px] flex-shrink-0">
        {candidate.missingSkills.length === 0 ? (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">✓ Все навыки</span>
        ) : (
          candidate.missingSkills.slice(0, 3).map((skill) => (
            <SkillBadge key={skill} skill={skill} variant="missing" />
          ))
        )}
        {candidate.missingSkills.length > 3 && (
          <span className="text-[10px] text-muted-foreground">+{candidate.missingSkills.length - 3}</span>
        )}
      </div>

      {/* Действия */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {candidate.githubUrl && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => window.open(`https://${candidate.githubUrl}`, '_blank')}
            title="GitHub профиль"
          >
            <Github className="w-4 h-4" />
          </Button>
        )}
        <Button
          size="sm"
          className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white gap-1.5 h-8"
          onClick={handleContact}
        >
          <Mail className="w-3.5 h-3.5" />
          Связаться
        </Button>
      </div>
    </div>
  );
}
