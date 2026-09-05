export interface BodyMeasurementDefinition {
  id: string;
  name: string;
  shortDescription: string;
  instructions: string;
}

export const femaleMeasurements: BodyMeasurementDefinition[] = [
  { id: 'head_circumference', name: 'Contorno de Cabeza', shortDescription: 'Circunferencia máxima de la cabeza.', instructions: 'Pasa la cinta métrica alrededor de la cabeza, justo por encima de las cejas en la parte frontal y por la parte más prominente de la nuca en la parte posterior.' },
  { id: 'neck_circumference', name: 'Contorno de Cuello', shortDescription: 'Circunferencia de la base del cuello.', instructions: 'Rodea la base del cuello con la cinta métrica, pasando justo por encima de las clavículas y la séptima vértebra cervical en la espalda. Deja el espacio de un dedo para holgura.' },
  { id: 'cross_shoulder', name: 'Ancho de Hombros', shortDescription: 'Distancia de hombro a hombro por la espalda.', instructions: 'Mide por la espalda desde el hueso del extremo de un hombro hasta el hueso del extremo del otro hombro, pasando ligeramente en curva por la base de la nuca.' },
  { id: 'front_cross', name: 'Ancho de Pecho Frontal', shortDescription: 'Distancia entre las sisas delanteras.', instructions: 'Mide horizontalmente en la parte frontal del pecho, desde el pliegue donde se une un brazo con el torso hasta el otro pliegue, justo por encima del busto.' },
  { id: 'back_cross', name: 'Ancho de Espalda', shortDescription: 'Distancia entre las sisas traseras.', instructions: 'Mide horizontalmente en la espalda, desde el pliegue de la axila izquierda hasta el pliegue de la axila derecha, a la mitad de la escápula.' },
  { id: 'high_bust', name: 'Contorno de Pecho Superior', shortDescription: 'Circunferencia por encima del busto.', instructions: 'Pasa la cinta métrica por debajo de las axilas y por encima de la parte más prominente del busto, manteniéndola ajustada y paralela al suelo por la espalda.' },
  { id: 'full_bust', name: 'Contorno de Busto', shortDescription: 'Circunferencia máxima del busto.', instructions: 'Rodea el torso pasando la cinta por la parte más prominente del busto. La cinta debe estar completamente horizontal y sin apretar demasiado.' },
  { id: 'under_bust', name: 'Contorno Bajo Busto', shortDescription: 'Circunferencia justo debajo del busto.', instructions: 'Mide alrededor de la caja torácica, exactamente por debajo de la base de los senos. Asegúrate de que la cinta esté ajustada y horizontal.' },
  { id: 'bust_span', name: 'Separación de Busto', shortDescription: 'Distancia entre ambos pezones.', instructions: 'Mide la distancia horizontal directa desde el centro de un pezón hasta el centro del otro.' },
  { id: 'bust_depth', name: 'Altura de Busto', shortDescription: 'Distancia desde el cuello hasta el pezón.', instructions: 'Coloca el inicio de la cinta en la base lateral del cuello y baja en línea recta hasta la parte más prominente del busto.' },
  { id: 'front_waist_length', name: 'Talle Delantero', shortDescription: 'Distancia frontal desde el cuello hasta la cintura.', instructions: 'Coloca la cinta en la base lateral del cuello, pásala por encima del busto y termina en la línea de la cintura natural.' },
  { id: 'back_waist_length', name: 'Talle de Espalda', shortDescription: 'Distancia trasera desde la nuca hasta la cintura.', instructions: 'Mide desde la vértebra más prominente de la nuca hasta la línea de la cintura natural.' },
  { id: 'natural_waist', name: 'Contorno de Cintura Natural', shortDescription: 'Parte más estrecha del torso.', instructions: 'Mide alrededor de la parte más angosta del abdomen. Inclina el torso hacia un lado para localizar el pliegue de la cintura natural.' },
  { id: 'high_hip', name: 'Contorno de Cadera Alta', shortDescription: 'Circunferencia a la altura de los huesos pélvicos.', instructions: 'Mide alrededor del cuerpo unos 8 o 10 centímetros por debajo de la cintura, pasando por encima de los huesos prominentes de la cadera.' },
  { id: 'full_hip', name: 'Contorno de Cadera', shortDescription: 'Circunferencia máxima de cadera y glúteos.', instructions: 'Mide alrededor de la parte más ancha de las caderas y los glúteos con los pies juntos y la cinta paralela al suelo.' },
  { id: 'hip_depth', name: 'Altura de Cadera', shortDescription: 'Distancia desde la cintura hasta la cadera máxima.', instructions: 'Mide por el costado desde la cintura natural hasta la línea del contorno de cadera máxima.' },
  { id: 'armhole', name: 'Contorno de Sisa', shortDescription: 'Circunferencia de la articulación del hombro.', instructions: 'Pasa la cinta por debajo de la axila y por encima del hueso del hombro, formando un círculo con holgura para el movimiento.' },
  { id: 'arm_length', name: 'Largo de Brazo', shortDescription: 'Distancia desde el hombro hasta la muñeca.', instructions: 'Con el brazo ligeramente flexionado, mide desde el extremo del hombro, pasando por el codo, hasta la muñeca.' },
  { id: 'bicep_circumference', name: 'Contorno de Bíceps', shortDescription: 'Circunferencia máxima del brazo.', instructions: 'Con el brazo relajado a un costado, mide alrededor de la parte más gruesa del brazo.' },
  { id: 'elbow_circumference', name: 'Contorno de Codo', shortDescription: 'Circunferencia del codo flexionado.', instructions: 'Dobla el brazo a 90 grados y mide alrededor de la articulación del codo.' },
  { id: 'wrist_circumference', name: 'Contorno de Muñeca', shortDescription: 'Circunferencia de la muñeca.', instructions: 'Mide alrededor de la muñeca, justo por debajo del hueso prominente.' },
  { id: 'crotch_depth', name: 'Altura de Tiro', shortDescription: 'Distancia de la cintura al asiento.', instructions: 'Sentada en una silla plana, mide por el costado desde la cintura natural hasta la superficie de la silla.' },
  { id: 'inseam', name: 'Entrepierna', shortDescription: 'Largo interno de la pierna.', instructions: 'Mide desde la costura más alta de la entrepierna hasta el tobillo o el suelo.' },
  { id: 'outseam', name: 'Largo Exterior de Pierna', shortDescription: 'Distancia desde la cintura hasta el tobillo.', instructions: 'Mide por el costado desde la cintura natural hasta el tobillo o el suelo.' },
  { id: 'thigh_circumference', name: 'Contorno de Muslo', shortDescription: 'Circunferencia máxima de la pierna.', instructions: 'Mide alrededor de la parte más gruesa del muslo, justo por debajo del pliegue del glúteo.' },
  { id: 'knee_circumference', name: 'Contorno de Rodilla', shortDescription: 'Circunferencia de la rodilla flexionada.', instructions: 'Con la pierna ligeramente flexionada, mide alrededor de la rótula y el pliegue posterior.' },
  { id: 'calf_circumference', name: 'Contorno de Pantorrilla', shortDescription: 'Circunferencia máxima de la pantorrilla.', instructions: 'Mide alrededor de la parte más prominente de la pantorrilla.' },
  { id: 'ankle_circumference', name: 'Contorno de Tobillo', shortDescription: 'Circunferencia justo por encima de los huesos del tobillo.', instructions: 'Mide alrededor de la parte más estrecha de la pierna, justo por encima de los huesos del tobillo.' }
];

export const maleMeasurements: BodyMeasurementDefinition[] = [
  { id: 'head_circumference', name: 'Contorno de Cabeza', shortDescription: 'Circunferencia máxima de la cabeza.', instructions: 'Pasa la cinta alrededor de la cabeza, justo por encima de las cejas y por la parte más prominente de la nuca.' },
  { id: 'neck_circumference', name: 'Contorno de Cuello', shortDescription: 'Circunferencia de la base del cuello.', instructions: 'Rodea el cuello justo debajo de la nuez de Adán. Deja el espacio de un dedo entre la cinta y el cuello.' },
  { id: 'cross_shoulder', name: 'Ancho de Hombros', shortDescription: 'Distancia de hombro a hombro por la espalda.', instructions: 'Mide por la espalda entre los extremos de ambos hombros siguiendo la curvatura natural.' },
  { id: 'front_cross', name: 'Ancho de Pecho Frontal', shortDescription: 'Distancia entre las sisas delanteras.', instructions: 'Mide horizontalmente desde el pliegue de un brazo con el torso hasta el pliegue del otro brazo.' },
  { id: 'back_cross', name: 'Ancho de Espalda', shortDescription: 'Distancia entre las sisas traseras.', instructions: 'Mide horizontalmente desde el pliegue de una axila hasta el de la otra, sobre los omóplatos.' },
  { id: 'chest_circumference', name: 'Contorno de Pecho', shortDescription: 'Circunferencia máxima del tórax.', instructions: 'Pasa la cinta por debajo de las axilas y rodea la parte más ancha del pecho y los omóplatos. Respira normalmente.' },
  { id: 'natural_waist', name: 'Contorno de Cintura Natural', shortDescription: 'Parte central del torso, a la altura del ombligo.', instructions: 'Mide alrededor del abdomen a la altura del ombligo.' },
  { id: 'trouser_waist', name: 'Cintura de Pantalón', shortDescription: 'Circunferencia donde se asienta el cinturón.', instructions: 'Mide alrededor de la cadera alta donde normalmente se abrocha el pantalón o se usa el cinturón.' },
  { id: 'full_hip', name: 'Contorno de Cadera / Asiento', shortDescription: 'Circunferencia máxima de los glúteos.', instructions: 'Con los pies juntos, mide alrededor de la parte más prominente de los glúteos y la cadera.' },
  { id: 'front_waist_length', name: 'Talle Delantero', shortDescription: 'Distancia frontal desde el cuello hasta la cintura.', instructions: 'Mide desde la base lateral del cuello, bajando por el pecho hasta la cintura natural.' },
  { id: 'back_waist_length', name: 'Talle de Espalda', shortDescription: 'Distancia trasera desde la nuca hasta la cintura.', instructions: 'Mide desde la vértebra prominente de la nuca hasta la cintura natural.' },
  { id: 'jacket_length', name: 'Largo de Chaqueta / Camisa', shortDescription: 'Largo total de la prenda superior.', instructions: 'Mide por la espalda desde la nuca hasta la longitud deseada de la prenda.' },
  { id: 'armhole', name: 'Contorno de Sisa', shortDescription: 'Circunferencia de la articulación del hombro.', instructions: 'Pasa la cinta por debajo de la axila y sobre el extremo del hombro, dejando movilidad.' },
  { id: 'arm_length', name: 'Largo de Brazo', shortDescription: 'Distancia desde el hombro hasta la muñeca.', instructions: 'Mide desde el extremo del hombro, pasando por el codo, hasta la muñeca.' },
  { id: 'bicep_circumference', name: 'Contorno de Bíceps', shortDescription: 'Circunferencia máxima del brazo.', instructions: 'Con el brazo relajado, mide alrededor de la parte más gruesa del bíceps.' },
  { id: 'elbow_circumference', name: 'Contorno de Codo', shortDescription: 'Circunferencia del codo flexionado.', instructions: 'Dobla el brazo a 90 grados y mide alrededor de la punta del codo.' },
  { id: 'wrist_circumference', name: 'Contorno de Muñeca', shortDescription: 'Circunferencia de la muñeca.', instructions: 'Mide alrededor de la muñeca justo sobre el hueso prominente.' },
  { id: 'crotch_depth', name: 'Altura de Tiro', shortDescription: 'Distancia de la cintura al asiento.', instructions: 'Sentado con la espalda recta, mide desde la cintura del pantalón hasta la superficie de la silla.' },
  { id: 'inseam', name: 'Entrepierna', shortDescription: 'Largo interno de la pierna.', instructions: 'Mide desde la costura más alta de la entrepierna hasta el tobillo.' },
  { id: 'outseam', name: 'Largo Exterior de Pierna', shortDescription: 'Distancia desde la cintura hasta el dobladillo.', instructions: 'Mide por el costado desde la cintura del pantalón hasta el zapato o largo deseado.' },
  { id: 'thigh_circumference', name: 'Contorno de Muslo', shortDescription: 'Circunferencia máxima del muslo.', instructions: 'Mide alrededor de la parte más gruesa del muslo, bajo el pliegue de la entrepierna.' },
  { id: 'knee_circumference', name: 'Contorno de Rodilla', shortDescription: 'Circunferencia de la rodilla.', instructions: 'Mide alrededor de la rodilla sobre la rótula, con la pierna ligeramente flexionada.' },
  { id: 'calf_circumference', name: 'Contorno de Pantorrilla', shortDescription: 'Circunferencia máxima de la pantorrilla.', instructions: 'Mide alrededor de la parte más gruesa de la pantorrilla.' },
  { id: 'ankle_circumference', name: 'Contorno de Tobillo', shortDescription: 'Circunferencia justo por encima del tobillo.', instructions: 'Mide alrededor de la parte más estrecha de la pierna, justo sobre los huesos del tobillo.' }
];
