// Утилиты для расчета процента соответствия вакансий
import type { Vacancy, VacancyMatch, StudentProfile } from './types';

/**
 * Рассчитывает процент соответствия между навыками студента и требованиями вакансии
 * @param studentSkills - навыки студента
 * @param requiredSkills - требуемые навыки вакансии
 * @returns процент совпадения (0-100)
 */
export function calculateMatchPercent(studentSkills: string[], requiredSkills: string[]): number {
  if (!requiredSkills.length) return 0;
  
  // Приводим к нижнему регистру для сравнения
  const normalizedStudentSkills = studentSkills.map(s => s.toLowerCase().trim());
  const normalizedRequiredSkills = requiredSkills.map(s => s.toLowerCase().trim());
  
  // Считаем совпадения
  const matchingCount = normalizedRequiredSkills.filter(required =>
    normalizedStudentSkills.includes(required)
  ).length;
  
  // Процент = (совпадающие навыки / требуемые навыки) * 100
  const percent = Math.round((matchingCount / normalizedRequiredSkills.length) * 100);
  
  return Math.min(100, Math.max(0, percent));
}

/**
 * Находит совпадающие навыки между студентом и вакансией
 * @param studentSkills - навыки студента
 * @param requiredSkills - требуемые навыки вакансии
 * @returns массив совпадающих навыков
 */
export function getMatchingSkills(studentSkills: string[], requiredSkills: string[]): string[] {
  const normalizedStudentSkills = studentSkills.map(s => s.toLowerCase().trim());
  
  return requiredSkills.filter(required =>
    normalizedStudentSkills.includes(required.toLowerCase().trim())
  );
}

/**
 * Находит недостающие навыки для вакансии
 * @param studentSkills - навыки студента
 * @param requiredSkills - требуемые навыки вакансии
 * @returns массив недостающих навыков
 */
export function getMissingSkills(studentSkills: string[], requiredSkills: string[]): string[] {
  const normalizedStudentSkills = studentSkills.map(s => s.toLowerCase().trim());
  
  return requiredSkills.filter(required =>
    !normalizedStudentSkills.includes(required.toLowerCase().trim())
  );
}

/**
 * Генерирует AI объяснение для матча
 * @param matchPercent - процент совпадения
 * @param matchingSkills - совпадающие навыки
 * @param missingSkills - недостающие навыки
 * @returns текст объяснения
 */
export function generateAIExplanation(
  matchPercent: number,
  matchingSkills: string[],
  missingSkills: string[]
): string {
  if (matchPercent >= 75) {
    return `Отличное совпадение! У вас есть ${matchingSkills.length} из ${matchingSkills.length + missingSkills.length} требуемых навыков. ${
      missingSkills.length > 0
        ? `Для идеального матча рекомендуем изучить: ${missingSkills.slice(0, 2).join(', ')}.`
        : 'Вы полностью соответствуете требованиям!'
    }`;
  }
  
  if (matchPercent >= 50) {
    return `Хорошее совпадение с ${matchPercent}% соответствием. У вас есть ключевые навыки: ${matchingSkills.slice(0, 3).join(', ')}. ${
      missingSkills.length > 0
        ? `Рекомендуем подтянуть: ${missingSkills.slice(0, 3).join(', ')}.`
        : ''
    }`;
  }
  
  if (matchPercent >= 25) {
    return `Среднее совпадение (${matchPercent}%). Совпадают: ${matchingSkills.slice(0, 2).join(', ')}. Для улучшения шансов изучите: ${missingSkills.slice(0, 3).join(', ')}.`;
  }
  
  return `Низкое совпадение (${matchPercent}%). Вакансия требует развития многих навыков: ${missingSkills.slice(0, 4).join(', ')}. Рассмотрите как возможность для роста.`;
}

/**
 * Конвертирует вакансию в формат VacancyMatch на основе профиля студента
 * @param vacancy - вакансия
 * @param studentProfile - профиль студента
 * @returns объект VacancyMatch с рассчитанным процентом
 */
export function vacancyToMatch(vacancy: Vacancy, studentProfile: StudentProfile): VacancyMatch {
  const matchPercent = calculateMatchPercent(studentProfile.skills, vacancy.requiredSkills);
  const matchingSkills = getMatchingSkills(studentProfile.skills, vacancy.requiredSkills);
  const missingSkills = getMissingSkills(studentProfile.skills, vacancy.requiredSkills);
  const aiExplanation = generateAIExplanation(matchPercent, matchingSkills, missingSkills);
  
  return {
    id: vacancy.id,
    vacancyTitle: vacancy.title,
    company: vacancy.company,
    matchPercent,
    matchingSkills,
    missingSkills,
    aiExplanation,
    salary: vacancy.salary,
    location: vacancy.location,
    employmentType: vacancy.employmentType,
  };
}

/**
 * Конвертирует массив вакансий в массив VacancyMatch
 * @param vacancies - массив вакансий
 * @param studentProfile - профиль студента
 * @returns массив VacancyMatch с рассчитанными процентами
 */
export function vacanciesToMatches(
  vacancies: Vacancy[],
  studentProfile: StudentProfile
): VacancyMatch[] {
  return vacancies.map(vacancy => vacancyToMatch(vacancy, studentProfile));
}
