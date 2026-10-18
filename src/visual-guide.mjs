import { requestLocalJson } from './local-llm.mjs';
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
const fields = ['population', 'architecture', 'materials', 'lighting'];
export function validateVisualGuide(value, data) {
  const guide = {};
  for (const key of fields) {
    const s = value?.[key];
    if (
      typeof s !== 'string' ||
      s.length < 4 ||
      s.length > 140 ||
      s.split(/\s+/).length > 18 ||
      /[<>\x00-\x1f]/.test(s)
    )
      throw Error('Guía visual incompleta: ' + key);
    guide[key] = s.trim();
  }
  const all = Object.values(guide).join(' ');
  if (
    /^(adult inhabitants|enclosed interiors|period-appropriate|common light and palette)$/i.test(
      guide.population,
    ) ||
    Object.values(guide).some(v =>
      /^(enclosed interiors|period-appropriate|common light and palette)$/i.test(v),
    )
  )
    throw Error(
      'Replace generic field definitions with concrete English visual details from the setting.',
    );
  if (
    /marte|mars/i.test(data.description) &&
    !/mars|martian|red (?:rock|dust|planet)/i.test(guide.architecture)
  )
    throw Error(
      'Use Martian colony interiors, red dust beyond sealed windows, futuristic metal walls.',
    );
  if (
    data.rules?.technology === 'preindustrial' &&
    /spacesuit|computer|hologram|electronic|laser|robot/i.test(all)
  )
    throw Error('La guía introduce tecnología incompatible');
  if (data.rules?.magic === false && /magical|enchanted|spell|wizard/i.test(all))
    throw Error('La guía introduce magia no permitida');
  if (/enanos/i.test(data.description) && !/dwarf|dwarves|dwarven/i.test(guide.population))
    throw Error(
      'population must describe one adult fantasy dwarf, stocky build and period clothing',
    );
  if (
    /profundidades|subterr[aá]ne|bajo.*monta[nñ]/i.test(data.description) &&
    !/underground|subterranean|cavern|mountain interior/i.test(guide.architecture)
  )
    throw Error(
      'architecture must say underground dwarven mountain halls or subterranean stone chambers when the setting is below a mountain',
    );
  return guide;
}
export async function visualGuide(root, data, { request = requestLocalJson } = {}) {
  if (!data.custom) return null;
  const key = createHash('sha256')
    .update('visual-guide-v1:' + JSON.stringify([data.description, data.rules, data.visualStyle]))
    .digest('hex');
  const folder = path.join(root, '.local/visual-guides'),
    file = path.join(folder, key + '.json');
  try {
    return validateVisualGuide(JSON.parse(await readFile(file, 'utf8')), data);
  } catch {}
  let reason = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const guide = validateVisualGuide(
        await request(
          [
            {
              role: 'system',
              content:
                'You write English image prompts. Output JSON with four short visual phrases. Adapt all fields to the user setting. population is a singular noun phrase describing ONE adult body and clothing, without actions. architecture describes indoor construction and location. materials lists physical materials. lighting describes light and colors. Use concrete visual nouns, never copy these instructions. Respect the supplied world rules; no crime facts.',
            },
            {
              role: 'user',
              content:
                'Create a visual design for this world: ' +
                data.description +
                '\nRules: ' +
                JSON.stringify(data.rules) +
                '\nWrite specific English visual details, 5 to 12 words per field. ' +
                (reason ? 'Repair: ' + reason : ''),
            },
          ],
          {
            type: 'object',
            properties: Object.fromEntries(fields.map(k => [k, { type: 'string' }])),
            required: fields,
            additionalProperties: false,
          },
          300,
          AbortSignal.timeout(25000),
          0.3,
          71 + attempt,
        ),
        data,
      );
      await mkdir(folder, { recursive: true });
      await writeFile(file + '.tmp', JSON.stringify(guide, null, 2));
      await rename(file + '.tmp', file);
      return guide;
    } catch (e) {
      reason = e.message;
    }
  }
  throw Error(
    'No se pudo preparar una guía visual coherente. Puedes reanudar sin perder las fichas. ' +
      reason,
  );
}
export function guidedImagePlan(data, plan, guide) {
  if (!guide) return plan;
  return plan.map(job => {
    let subject = job.prompt.split(', ' + (data.visualStyle || '___'))[0];
    if (job.id.startsWith('person-')) {
      const p = data.world.people.find(p => 'person-' + p.id === job.id);
      subject = (p?.imagePrompt || subject)
        .replace(/portrait of (?:an? |one )?(?:adult )?(?:man|woman|person|dwarf)(?:\s|,)/gi, '')
        .replace(/^portrait of /i, '');
      return {
        ...job,
        prompt: `Portrait of one ${guide.population}, ${subject}, ${guide.lighting}, detailed painted illustration`,
      };
    }
    if (job.id.startsWith('room-')) {
      const r = data.world.rooms.find(r => 'room-' + r.id === job.id);
      return {
        ...job,
        prompt: `${guide.architecture}, ${r?.imagePrompt || subject}, ${guide.materials}, ${guide.lighting}, painted illustration, no people`,
      };
    }
    // Keep the exact evidence subject first; art direction never changes the crime object.
    return {
      ...job,
      prompt: `${subject.split(/, (?:retro science fiction|1930s noir|medieval castle|high fantasy)/)[0]}, centered evidence object on a plain dark background, ${guide.lighting}, detailed illustration, no text`,
    };
  });
}
