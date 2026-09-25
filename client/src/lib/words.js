import { usePeopleStore } from '../stores/peopleStore';

const PRONOUNS = {
  she: { they: 'she', them: 'her', their: 'her', theyre: "she's", theyAre: 'she is' },
  he: { they: 'he', them: 'him', their: 'his', theyre: "he's", theyAre: 'he is' },
  they: { they: 'they', them: 'them', their: 'their', theyre: "they're", theyAre: 'they are' },
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * How we refer to the other person throughout the UI: "She's online",
 * "Send her something", "Talk to her". Uses their name when it's a real name
 * and pronouns otherwise, so the default "Her" reads naturally.
 */
export function wordsFor(person) {
  const p = PRONOUNS[person?.pronouns] ?? PRONOUNS.they;
  const name = person?.name ?? 'Them';
  const generic = ['her', 'him', 'them'].includes(name.toLowerCase());
  return {
    name,
    ...p,
    They: cap(p.they),
    Them: cap(p.them),
    Their: cap(p.their),
    Theyre: cap(p.theyre),
    /** Subject for sentences like "___ sent you a rose" */
    Subject: generic ? cap(p.they) : name,
    plural: p.they === 'they',
  };
}

export const usePartnerWords = () => wordsFor(usePeopleStore((s) => s.partner));
export const partnerWords = () => wordsFor(usePeopleStore.getState().partner);
