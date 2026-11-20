// AJUSTES PERSONALES Y REFERENCIAS DEL SIMULADOR
// Los 6 campos visibles se pueden modificar directamente en la página.
window.SIM_CONFIG = {
  titulo: 'Riego y manejo eficiente del agua en cultivo de banano',
  ubicacion: 'Ubicacion: Vereda Piedras blancas · Caracolicito · El Copey, Cesar, Colombia',
  descripcion: 'Simulador académico de evapotranspiración y diseño geométrico de sectores de riego',
  valoresIniciales: {
    plants: 100,     // Aproximadamente 100 plantas, dato del caso de estudio.
    flow: 4,         // Caudal (L/h) de CADA gotero: SUPUESTO no medido.
    hours: 2,        // 1 hora en la mañana + 1 hora en la noche en época seca.
    eto: 4.5,        // Evapotranspiración de referencia (mm/día): SUPUESTO.
    pe: 0,          // Lluvia efectiva (mm/día): ESCENARIO DE DÍA SECO.
    kc: 1.1,        // Coeficiente de cultivo EDITABLE (ejemplo para banano).
    perimeter: 200, // Tubo perimetral hipotético disponible (m): SIMULADO.
    width: 25,      // Ancho del sector (m): SIMULADO.
    target: 2000    // Área objetivo del sector (m²): SIMULADA.
  },
  parametrosInternos: {
    areaEstudioHa: 1.5,        // Área real APROXIMADA dedicada al banano.
    goterosPorPlanta: 1,       // Confirmado para la finca.
    separacionMetros: 4.5,    // Promedio 4–5 m, marco supuesto para sector.
    eficiencia: 0.90,         // SUPUESTO, no medido.
    areaHidricaPorPlanta: 5.05, // m²/planta, EQUIVALENCIA didáctica, no cobertura medida.
    fraccionLluviaEfectiva: 0.80 // APROXIMACIÓN para usar referencia mensual (no una medición).
  },
  // Referencia regional indicada en el documento oficial de 2016. NO mediciones de finca ni normales IDEAM.
  lluviaRegional: [
    {id:'12', mes:'Diciembre', mm:23, dias:31},
    {id:'01', mes:'Enero', mm:14, dias:31},
    {id:'02', mes:'Febrero', mm:25, dias:28},
    {id:'03', mes:'Marzo', mm:60, dias:31}
  ]
};
