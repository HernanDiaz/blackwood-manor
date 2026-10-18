// Delivery only: these lines must not add memories, evidence or motives.
export const personalities = {
  elena: {
    voice:
      'Orgullosa y contenida. Trata de usted, frases completas y firmes. No busca simpatía ni se disculpa. Ante presión exige precisión, sin insultar ni inventar hechos.',
    open: ['Voy a ser muy clara. ', 'Le agradecería que escuchara mi respuesta. '],
    close: [' No confunda mis palabras.', ' ¿Qué quiere aclarar exactamente?'],
    unknown:
      'No pondrá en mi boca una respuesta que no tengo. Pregunte por mi coartada o por mi relación con Edmund.',
    accusation:
      'Una acusación exige pruebas. Pregunte por mis actos y saque sus propias conclusiones.',
    insult: 'Si pretende provocarme, está perdiendo el tiempo. Haga una pregunta pertinente.',
    greeting: 'Buenas. Puede empezar con sus preguntas.',
  },
  victor: {
    voice:
      'Médico reservado y analítico. Trata de usted. Separa observación y conjetura, usa formulaciones precisas y breves. Bajo presión corrige la pregunta, no inventa diagnósticos ni causas.',
    open: ['Seamos precisos. ', 'Ciñámonos a los hechos. '],
    close: [' Conviene distinguir las cosas.', ' ¿Cuál es su pregunta concreta?'],
    unknown:
      'No dispongo de información para afirmarlo. Limitémonos a mi coartada o a mi relación con Edmund.',
    accusation:
      'No puedo identificar al responsable. Tendrá que contrastar los testimonios con las pruebas.',
    insult: 'Ese comentario no ayuda a esclarecer los hechos. Reformule su pregunta.',
    greeting: 'Buenas. ¿Qué desea precisar?',
  },
  clara: {
    voice:
      'Observadora, prudente y directa. Trata de usted. Prefiere palabras sencillas y distingue lo que sabe de lo que supone. No pide perdón constantemente. Bajo presión insiste en los detalles verificables.',
    open: ['Se lo diré sin rodeos. ', 'Escuche bien este detalle. '],
    close: [' Eso es lo que puedo decirle.', ' ¿Qué parte necesita aclarar?'],
    unknown: 'Eso no lo sé. Puedo decirle dónde estaba o hablar de mi relación con Edmund.',
    accusation: 'No sé quién lo hizo. Compare lo que le contamos con lo que encuentre.',
    insult: 'No hace falta hablarme así. Pregunte por lo ocurrido.',
    greeting: 'Hola. Dígame qué necesita aclarar.',
  },
  arthur: {
    voice:
      'Mayordomo formal, discreto y seco. Trata de usted y usa señor detective ocasionalmente. Frases ordenadas, pocas emociones. Bajo presión mantiene la cortesía sin servilismo. No inventa detalles del servicio.',
    open: ['Señor detective, seré preciso. ', 'Si me permite, responderé por orden. '],
    close: [' Eso es todo sobre ese punto.', ' ¿Desea alguna precisión, señor detective?'],
    unknown:
      'No podría informarle sobre ese punto, señor detective. Sí puedo responder sobre mi coartada o mi relación con Sir Edmund.',
    accusation:
      'No me corresponde señalar a nadie, señor detective. Puedo responder por mis propios actos.',
    insult: 'Mantengamos las formas, señor detective. ¿Desea hacer una pregunta sobre el caso?',
    greeting: 'Buenas, señor detective. Le escucho.',
  },
  julian: {
    voice:
      'Sobrino impaciente y defensivo. Tutea al detective. Frases cortas, lenguaje coloquial sin jerga moderna. Le molesta que insinúen más de lo dicho. Bajo presión se vuelve cortante, no violento. No añade recuerdos ni confesiones.',
    open: ['Vale, escucha. ', 'Te lo digo claro. '],
    close: [' No le des más vueltas a lo que he dicho.', ' ¿Qué más quieres aclarar?'],
    unknown: 'Eso no lo sé. Pregúntame dónde estaba o por qué discutí con mi tío.',
    accusation:
      '¿Y cómo quieres que sepa quién lo hizo? Pregúntame por mis actos y compáralos con las pruebas.',
    insult: '¿En serio? Estamos hablando de la muerte de mi tío. Haz una pregunta sobre esa noche.',
    greeting: 'Hola. Vamos, ¿qué quieres preguntarme?',
  },
};
const renditions = {
  'Estuve en el comedor con Julián desde las 21:00 hasta el grito.':
    'Desde las 21:00 hasta que se oyó el grito estuve en el comedor, con Julián. Mi respuesta es bastante clara.',
  'Mi padre amenazó con desheredarme. Discutimos, sí.':
    'Sí, discutí con mi padre. Me amenazó con desheredarme. No voy a fingir lo contrario para complacerle.',
  'Llevé el té al despacho y salí a las 21:18. Edmund seguía vivo.':
    'Conviene precisar la secuencia: llevé el té al despacho y salí a las 21:18. En ese momento Edmund seguía vivo.',
  'Edmund quería hablar de unas cuentas. Era un malentendido.':
    'Se trataba de unas cuentas que Edmund quería discutir conmigo. Un malentendido. Seamos precisos con los términos.',
  'Arthur preparó el té. Yo llevé la bandeja.':
    'Distingamos las dos cosas: Arthur preparó el té; yo transporté la bandeja.',
  'Revisé el inventario con Arthur en la cocina de 21:10 a 21:25.':
    'Estaba en la cocina, revisando el inventario con Arthur. De 21:10 a 21:25. Ese es el detalle que puedo darle.',
  'Dependía de este empleo, pero no quería que Edmund muriera.':
    'Necesitaba este empleo. Eso es cierto. Pero no quería que Edmund muriera; no mezcle las dos cosas.',
  'Clara estuvo conmigo en la cocina hasta el ruido de la taza.':
    'Clara estaba conmigo en la cocina, señor detective. Permanecimos allí hasta que se oyó el ruido de la taza.',
  'Preparé el té a las 21:05. El doctor insistió en llevarlo él mismo.':
    'El té lo preparé yo, a las 21:05. El doctor insistió en llevarlo personalmente. Cada cual tuvo su cometido, señor detective.',
  'Serví a Sir Edmund durante treinta años. No tenía nada que ganar.':
    'Treinta años al servicio de Sir Edmund, señor detective. No tenía nada que ganar. No puedo expresarlo con mayor claridad.',
  'Estuve con Elena en el comedor. La fotografía tiene la hora.':
    'Estaba en el comedor con Elena. Mira la fotografía: tiene la hora. Ahí tienes mi respuesta.',
  'Le debía dinero. Discutimos a las 20:50 y después no volví a verlo.':
    'Sí, le debía dinero. Discutimos a las 20:50. Después no volví a verlo. No le des más vueltas a lo que he dicho.',
};
export function personaOptions(person, text) {
  const p = personalities[person];
  const body = renditions[text] || text;
  return p
    ? [renditions[text] || p.open[0] + body, p.open[1] + body, body + p.close[0], body + p.close[1]]
    : [text];
}
export function personaAnswer(state, person, text) {
  const options = personaOptions(person, text),
    turn = state.chat.filter(m => m.person === person).length;
  return options[turn % options.length];
}
