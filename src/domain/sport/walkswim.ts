import walk from '../../content/walk.json';
import swim from '../../content/swim.json';

export interface WalkTarget {
  focus: string;
  minutes: number;
  speedKmh: number;
  inclinePct: number;
  tip: string;
}

/** Marche du dimanche : durée (S1-4), puis allure (S5-12), puis pente (S13+). Conventions Daybakh. */
export function walkTarget(week: number): WalkTarget {
  const ph = walk.phases.find((x) => week >= x.fromWeek && week <= x.toWeek) ?? walk.phases[walk.phases.length - 1];
  const i = week - ph.fromWeek;
  const minutes = ph.minutes[Math.min(i, ph.minutes.length - 1)];
  let speed = ph.speedKmh;
  if ('speedStepKmhEvery2Weeks' in ph) speed = Math.min(ph.maxSpeedKmh!, ph.speedKmh + Math.floor(i / 2) * ph.speedStepKmhEvery2Weeks!);
  let incline = ph.inclinePct;
  if ('inclineStepEvery2Weeks' in ph) incline = Math.min(ph.maxInclinePct!, ph.inclinePct + Math.floor(i / 2) * ph.inclineStepEvery2Weeks!);
  return { focus: ph.focus, minutes, speedKmh: Math.round(speed * 10) / 10, inclinePct: incline, tip: ph.tip };
}

export function swimPlan(week: number) {
  const pr = swim.progression.find((x) => week >= x.fromWeek && week <= x.toWeek) ?? swim.progression[swim.progression.length - 1];
  return {
    parts: swim.parts.map((p) => (p.title === 'Bloc technique' ? { ...p, content: `${week % 2 === 1 ? 'Brasse' : 'Dos'} cette semaine : longueurs entrecoupées de pauses au bord.` } : p)),
    goal: pr.goal,
    endurance: pr.endurance,
    tips: swim.tips,
    totalMinutes: swim.parts.reduce((s, p) => s + p.minutes, 0)
  };
}
