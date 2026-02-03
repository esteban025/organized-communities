# GESTION DE CONVIVENCIAS PARA LAS COMUNIDADES

## Ideas principales a implementar
- Toda convivencia al momento de iniciar o crear una convivencia, se debe registar:
  - Un titulo
  - Una descripcion (opcional)
  - Fecha de inicio
  - Fecha de fin
  - costo de convivencia
  - Seleccionar las comunidades que asistiran a dicha convivencia (pueden ser varias).
- Una vez creada la convivencia, se debe permitir agregar hermanos a la convivencia, estos hermanos pueden ser de cualquiera de las comunidades seleccionadas en la convivencia, a todos estos hermanos los llamaremos como invitados a la convivencia.
- Al momento de agregar a un hermano a la convivencia, se debe permitir que el hermano o la pareja de hermanos (en caso de matrimonios) pueda registrar una observacion o comentario antes de registarse por ejemplo (Asiste con bebe en brazos, no puede subir escaleras ... etc), a estos hermanos los llamaremos confirmados a la convivencia.
- Los separamos como invitados y confirmados, porque los invitados son todos los hermanos que pueden asistir a la convivencia (de las comunidades seleccionadas) y los confirmados son los hermanos que ya han confirmado su asistencia a la convivencia.
- Se debe permitir ver la lista de hermanos registrados en la convivencia, con sus observaciones correspondientes.
- Se debe permitir eliminar a un hermano de la convivencia (solamente de confirmados, si se le elimina de la lista de confirmados pasa a ser de la lista de invitados, pero en esta lista no se les puede eliminar).
- Se debe permitir editar la observacion de un hermano ya registrado en la convivencia.
- Se debe permitir invitar a un hermano que no este registrado en ninguna de las comunidades seleccionadas en la convivencia, para esto existira un input de busqueda por nombre y apellido y lo agregamos a la lista de invitados y de ahi puede confirmar su asistencia.
- Los hermanos pueden ser alojados distintamente de la comunidad que sea en distintas casas de convivencia 
- Antes de finalizar la convivencia, se debe permitir revisar o guardar realmente los hermanos que si asistieron a la convivencia, para esto se debe permitir marcar o desmarcar a los hermanos que asistieron y en que casa de convivencia fueron ubicados, y al finalizar guardar la lista final de hermanos que asistieron a la convivencia.
- En esta lista final de hermanos se debe permitir dirigirme a nueva pagina donde se pueda ver el resumen de la convivencia, con la lista de hermanos que asistieron, y un boton para descargar un reporte en PDF de la convivencia.
- Para la lista de hermanos que asistieron a la convivencia, se debe permitir filtrar por comunidad, por casa de convivencia o por invitados/confirmados.

### Gestion de cobranzas
- LA GESTION DE DINERO SE HACE EN SECRETO, ES DEVIR JAMAS SE SABRA QUIENES CANCELARON EL TOTAL O PARCIALMENTE SU DEUDA, ESTO ES SOLO PARA USO INTERNO DE LA COMUNIDAD. POR LO QUE SOLO SE REGISTRA LA DEUDA TOTAL.

- Las convivencias tienen un costo asociado por hermano que asiste a la convivencia, este costo puede variar segun la convivencia, pero debe ser registrado al momento de crear la convivencia.
- Al momento de finalizar la convivencia, se debe permitir generar las cobranzas correspondientes por cada comunidad confirmada en la convivencia. (si fueron 3 comunidades, se generan 3 cobranzas, una por cada comunidad).
- Cada cobranza debe tener el detalle de los hermanos que asistieron a la convivencia, y el costo total de la convivencia por comunidad y la deuda de la comunidad.
- SIEMPRE EL COSTO DE DEUDA SERA POR COMUNIDAD.

### Gestion de casas de convivencia
- Habran distintas casas de convivencia donde se pueden alojar a los hermanos que asisten a la convivencia, estas casas deben ser registradas previamente en el sistema.
- Cada casa de convivencia debe tener un nombre, direccion, capacidad maxima de hermanos y una descripcion (opcional).

### Variaciones
- Habra ocasiones especiales en donde si se deba saber el monto de deuda para cada hermano que asistio a la conviencia, en este caso se debe permitir registrar el monto de la deuda total dividida para cada hermano que asistio, este caso especial sucedera solamente cuando se haga una convivencia solamente con los responsables y corresponsables de las comunidad, sin embargo el deuda sera por comunidad