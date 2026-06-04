import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import { Screen } from '../../src/components/Screen';
import { useAppTheme } from '../../src/providers/ThemeProvider';

const CELESTE_DARK = '#3DA5F5';

export default function TerminosYCondicionesScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const bg = theme.isDark ? '#0D0D0D' : '#F5F7FA';

  return (
    <Screen style={{ backgroundColor: bg }}>
      {/* Header con botón volver */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Términos y Condiciones</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.mainTitle, { color: theme.colors.text }]}>
            Bases y Condiciones
          </Text>
          <Text style={[styles.subtitle, { color: CELESTE_DARK }]}>
            PRODE Mundialista Grupo Núcleo
          </Text>

          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            Las presentes Bases y Condiciones regulan la participación en la acción promocional denominada "PRODE Mundialista Grupo Núcleo", organizada por GRUPO NUCLEO S.A. (en adelante el "organizador) CUIT 30-70933244-5, con domicilio legal en Chaco 1670, Mar del Plata, Buenos Aires.
          </Text>

          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            La participación en esta acción implica el pleno conocimiento y aceptación de las presentes Bases y Condiciones.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            1. Nombre de la acción
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            La acción se denomina "PRODE Mundialista Grupo Núcleo" y consiste en un juego de pronósticos deportivos en el que los participantes deberán predecir los resultados de los partidos correspondientes al torneo mundialista de fútbol 2026 sumando puntos de acuerdo con los aciertos obtenidos.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            2. Vigencia
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            La acción tendrá vigencia desde el día [FECHA DE INICIO] hasta el día [FECHA DE FINALIZACIÓN], o hasta la finalización del último partido incluido dentro de la plataforma del PRODE, lo que ocurra primero.
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            El Organizador podrá modificar las fechas de inicio, cierre o publicación de ganadores en caso de fuerza mayor, caso fortuito, cambios en el calendario deportivo o situaciones ajenas a su control.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            3. Participantes
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            Podrán participar exclusivamente clientes activos de Grupo Núcleo, mayores de 18 años, que hayan sido invitados o habilitados por el Organizador o por su Ejecutivo de Cuenta.
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            La participación estará dirigida a clientes con relación comercial vigente con Grupo Núcleo al momento de la inscripción y durante el desarrollo de la acción.
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            No podrán participar empleados, directivos, representantes, agencias, proveedores directos del Organizador ni personas vinculadas a la organización, administración o ejecución de la presente acción, salvo autorización expresa del Organizador.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            4. Participación gratuita
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            La participación en el PRODE Mundialista Grupo Núcleo es gratuita y sin obligación de compra.
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            La inscripción y participación no implican obligación alguna de adquirir productos o contratar servicios de Grupo Núcleo.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            5. Inscripción
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            Para participar, los clientes deberán registrarse a través de la plataforma o medio indicado por Grupo Núcleo, completando los datos solicitados de forma veraz, completa y actualizada.
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            El Organizador podrá solicitar información adicional para validar la condición de cliente activo, identidad del participante y cumplimiento de los requisitos establecidos en estas Bases y Condiciones.
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            Cada cliente podrá participar con una única cuenta o usuario, salvo que el Organizador indique expresamente lo contrario.
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            En caso de detectarse múltiples registros asociados a un mismo participante, uso indebido de datos, información falsa o cualquier maniobra considerada irregular, el Organizador podrá descalificar al participante sin derecho a reclamo alguno.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            6. Mecánica de participación
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            Los participantes deberán ingresar a la plataforma del PRODE y cargar sus pronósticos para los partidos disponibles.
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            Cada pronóstico consistirá en predecir el resultado de los partidos incluidos en la acción, según las opciones habilitadas por la plataforma.
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            Los pronósticos podrán cargarse o modificarse hasta [5 / 10] minutos antes del inicio oficial de cada partido. Una vez vencido dicho plazo, el sistema bloqueará la carga o modificación del pronóstico correspondiente.
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            El Organizador no será responsable por pronósticos no cargados, cargados fuera de término, errores de conexión, fallas técnicas, interrupciones del servicio, inconvenientes con dispositivos del participante o cualquier otra circunstancia ajena al Organizador.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            7. Sistema de puntuación
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            Los participantes sumarán puntos de acuerdo con sus aciertos en cada partido. El sistema de puntuación será el siguiente:
          </Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.text }]}>
            • Resultado simple acertado: 2 puntos. Se considera resultado simple acertado cuando el participante predice correctamente el equipo ganador o el empate.
          </Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.text }]}>
            • Resultado exacto acertado: 3 puntos. Se considera resultado exacto acertado cuando el participante predice correctamente el marcador final del partido.
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            Los puntos por resultado simple y resultado exacto no serán acumulables, salvo que la plataforma o el Organizador indiquen expresamente otra modalidad.
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            A los fines del cómputo de puntos, se tomará como válido el resultado oficial del partido según lo informado por la organización del torneo o por la fuente que utilice la plataforma del PRODE.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            8. Ranking
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            Durante la vigencia de la acción, los participantes integrarán un ranking general en función de los puntos obtenidos.
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            El ranking podrá visualizarse en la plataforma o por los medios que Grupo Núcleo determine.
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            La posición final de cada participante será determinada una vez finalizado el último partido incluido en la acción y computados todos los puntos correspondientes.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            9. Criterios de desempate
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            En caso de empate entre dos o más participantes, se aplicarán los siguientes criterios de desempate, en el orden indicado:
          </Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.text }]}>
            1. Mayor cantidad de resultados exactos acertados.
          </Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.text }]}>
            2. Mayor cantidad de resultados simples acertados.
          </Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.text }]}>
            3. Participante que se haya registrado primero en la plataforma.
          </Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.text }]}>
            4. En caso de persistir el empate, el Organizador podrá resolverlo mediante sorteo, criterio adicional informado oportunamente o decisión fundada.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            10. Ganadores
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            Serán considerados ganadores aquellos participantes que ocupen las primeras posiciones del ranking final, según la cantidad de premios disponibles.
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            El Organizador comunicará los ganadores dentro de los días hábiles posteriores a la finalización del último partido incluido en la acción.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            11. Premios
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            Los premios del PRODE Mundialista Grupo Núcleo serán los siguientes:
          </Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.text }]}>
            • Notebook PCBOX
          </Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.text }]}>
            • Bicicleta KANY rodado 29
          </Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.text }]}>
            • Silla gamer Formula V Line
          </Text>
          <Text style={[styles.bulletPoint, { color: theme.colors.text }]}>
            • Parlante PCBOX Night Bluetooth 120W
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            Asignación sugerida: 1° puesto: Notebook PCBOX. 2° puesto: Bicicleta KANY. 3° puesto: Silla gamer. 4° puesto: Parlante PCBOX.
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            Los premios no podrán ser canjeados por dinero en efectivo, productos alternativos, crédito comercial, descuentos ni otros bienes o servicios, salvo decisión expresa del Organizador.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            12. Entrega de premios
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            La entrega de los premios será coordinada por Grupo Núcleo con cada ganador. El Organizador informará oportunamente la modalidad de entrega, que podrá ser presencial, por envío o mediante retiro en el lugar que se indique.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            13. Responsabilidad del Organizador
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            El Organizador no será responsable por daños, pérdidas, perjuicios, inconvenientes técnicos, errores humanos, fallas de conexión, interrupciones del servicio, problemas de acceso a la plataforma, pérdida de datos, demoras o cualquier otra circunstancia que impida o dificulte la participación, cuando dichas situaciones sean ajenas a su control.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            14. Conductas prohibidas
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            Queda prohibido realizar cualquier acción que altere, manipule o afecte el normal funcionamiento de la acción, la plataforma, el sistema de puntuación o el ranking.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            15. Datos personales
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            Los datos personales proporcionados por los participantes serán utilizados exclusivamente para la gestión de la presente acción, validación de participantes, comunicación con ganadores, entrega de premios y acciones comerciales relacionadas con Grupo Núcleo.
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            El tratamiento de los datos personales se realizará conforme a la normativa vigente en materia de protección de datos personales, incluyendo la Ley N° 25.326 de Protección de Datos Personales, en caso de corresponder.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            16. Uso de nombre e imagen
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            Los participantes que resulten ganadores autorizan al Organizador a difundir su nombre, apellido, empresa a la que pertenecen, imagen, voz, localidad y/o posición en el ranking, exclusivamente con fines de comunicación, difusión y promoción de la presente acción.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            17. Aceptación de las Bases y Condiciones
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            La participación en el PRODE Mundialista Grupo Núcleo implica la aceptación total de estas Bases y Condiciones.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            18. Ausencia de vínculo con entidades deportivas
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            La presente acción es organizada exclusivamente por Grupo Núcleo. No se encuentra patrocinada, administrada, avalada ni asociada oficialmente con FIFA, AFA, CONMEBOL, selecciones nacionales, clubes, jugadores ni ninguna otra entidad deportiva, salvo que se indique expresamente lo contrario.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            19. Jurisdicción
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.text }]}>
            Para cualquier controversia derivada de la presente acción, las partes se someterán a la jurisdicción de los tribunales ordinarios competentes de Mar del Plata, Buenos Aires, con renuncia expresa a cualquier otro fuero o jurisdicción que pudiera corresponder.
          </Text>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.muted }]}>
              Grupo Núcleo S.A.
            </Text>
            <Text style={[styles.footerText, { color: theme.colors.muted }]}>
              CUIT 30-70933244-5
            </Text>
            <Text style={[styles.footerText, { color: theme.colors.muted }]}>
              Chaco 1670, Mar del Plata, Buenos Aires
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  container: {
    margin: 16,
    borderRadius: 20,
    padding: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
    paddingLeft: 8,
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(110,198,255,0.2)',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
