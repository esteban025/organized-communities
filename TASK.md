# TAREAS DE LOGICA Y CORRECCIONES

## Primarias
- [] Implementar las acciones en todas las tablas para editar y eliminar corrspondientemente segun la tabla. 

- [✔] Implementa la logica completa para agregar un hermano a la db, usando los archivos FormBrother.astro y sobre todo la logica tendra que ser implementada en el archivo /services/brothers.ts, es ahi donde ira toda la conecion con la base de datos, posteriormente sera llamado en las astro:actions en este caso en el archivo /actions/brothers.ts

- La logica es la siguiente:
  - Si es matrimonio aplicamos:
    - Si el hermano es responsable de comunidad, el matrimonio completo sera responsable de comunidad, al igual que cualquier otro rol, de igual manera cuando se edite un matrimonio, ambos hermanos tendran los mismos roles.
    - Estos roles tendras que hacer tambien un post en la tabla de roles para guardar los roles de cada hermano.
    - Debes implementar el spouse_id en la tabla de hermanos para relacionar ambos hermanos.

  - Si es soltero/a aplicamos:
    = No hay mucho por decir, simplemente se guarda al hermano con sus roles correspondientes.


- si deseas saber la estructura de la db puedes revisar en /lib/db-template.sql

### Preguntas sobre la logica a implementar
<!-- tus pregunstas aqui -->

1. **Matrimonios (estructura en DB)**
  - Cuando se crea un matrimonio, ¿deben crearse **dos filas** en `brothers` (una por cada cónyuge) con `spouse_id` apuntando uno al otro (relación bidireccional), o solo uno de ellos debe tener `spouse_id`?

   - DEBE SER DOS FILAS EN BROTHERS, CADA UNO APUNTANDO AL OTRO. EJEMPLO ID: 1, SPOUSE_ID: 2 Y ID: 2, SPOUSE_ID: 1

  - ¿El `community_id` de ambos en un matrimonio debe ser siempre el mismo que el `communityId` de la página/formulario, o podría diferir en algún caso especial?

  - SI EXACTAMENTE, EL FORMULARIO CONTIENE EL ID DE LA COMUNIDAD POR TANTO CUANDO SE REGISTRA UN HERMANO SERA EN LA COMUNIDAD QUE ESTA VIENDO EN ESE MOMENTO.

2. **Roles y tabla `brother_roles`**
  - En `brother_roles`, ¿la columna `community_id` debe ser siempre la comunidad “propia” del hermano salvo cuando es catequista en otras comunidades (como ya se hace en `getGroupCatechists`), correcto?

  - SI SIEMPRE SERA LOS ROLES EN ESA COMUNIDAD PROPIA A EXCEPCION DE CATEQUISTA QUE SERA EN OTRAS COMUNIDADES.

  - Para catequistas en otras comunidades (las seleccionadas en `IfCatechistInput`), ¿quieres que haya **una sola fila en `brothers`** (community_id principal) y **varias filas en `brother_roles`** con distintos `community_id` donde tenga rol `catequista`?

  - ENTIENDO QUE SI ESCOGE QUE ES CATEQUISTA EN MAS DE UNA COMUNIDAD, ENTONCES SI, SERA UNA SOLA FILA EN BROTHER_ROLES POR CADA COMUNIDAD DONDE SEA CATEQUISTA
   - 
  - Si un hermano tiene varios roles en la misma comunidad (ej. responsable + ostiario), ¿esperas varias filas en `brother_roles` con el mismo `brother_id` y `community_id` pero distinto `role`?

  - TENGO UNA NUEVA TABLA EN /lib/db-template.sql LLAMDA catechists_by_community SI TE AYUDA A MEJORAR LA LOGICA QUE DICES OCUPALA DE LA MEJORAR MANEARA POSIBLE, SIN EMBARGO DEJO A TU CONSIDERACION SI ES MEJOR EN UNA SOLA FILA O NO.

3. **Flujo de creación desde `FormBrother`**
  - En el caso de catequista, ¿el `community_id` del registro en `brothers` debe ser siempre la comunidad actual de la página (`communityId`), aunque luego tenga rol de catequista en otras comunidades, o prefieres usar otra comunidad como “principal”?

   - EL ID DE LA COMUNIDAD SERA SIEMPRE LA COMUNIDAD ACTUAL DE LA PAGINA. PERO PARA HACER LOS ROLES DE CATEUISTAS TENDRAS QUE OBTENER EL ID DE LA COMUNIDAD DESDE EL INPUT OCULTO QUE AGREGE EN IfCatechistInput.

  - Al crear un hermano, ¿es suficiente que `createBrotherInDB` devuelva `{ id }` y un mensaje, o necesitas que devuelva también los datos completos del hermano + roles para refrescar la UI sin re-consulta?
    - DEVUELVE SOLO EL NOMBRE Y MENSAJE, LUEGO DESDE EL FRONTEND HACEMOS UNA NUEVA CONSULTA PARA OBTENER LOS DATOS COMPLETOS.

4. **Edición de matrimonios y hermanos**
  - Cuando se edite un matrimonio, ¿la edición se hará siempre desde un único formulario (igual que la creación) y debemos sincronizar los roles en ambos `brother_id` (actualizando `brother_roles` para los dos)?

   - PARA LA EDICION DE UN MATRIMONIO, TENDREMOS EN CUENTA LOS SIGUIENTE:
      - EL BOTON DE EDITAR MATRIMONIO PRIMERO DEBE MOSTRAR UN PEQUENIA LISTA CON DOS ITEMS, ESPOSO O ESPOSA Y SEGUN EN CUAL DE CLICK, RELLENAMOS EL FORMULARIO CON LA INFORMACION CORRESPONDIENTE, Y LOS INPUTS CONTRARIOS DEL SELECCIONADO DEBERAS APLICAR SOLAMENTE UNA CLASE CSS PARA QUE SE VEAN DESHABILITADOS Y NO SE PUEDAN EDITAR.
      - TENDRAS QUE CREAR UN IMPUT OCULTO PARA SABER SI ESPOSO O ESPOSA SE ESTA EDITANDO.
      - AL MOMENTO DE GUARDAR LOS CAMBIOS, DEBERAS ACTUALIZAR AMBOS HERMANOS CON LA INFORMACION CORRESPONDIENTE.
      - sI SE CAMBIA LOS ROLES TAMBIEN DEBERAS ACTUALIZARLOS EN AMBOS HERMANOS.
      - NO SE PODRA EDITAR EL CIVIL STATUS, YA QUE SI ES MATRIMONIO DEBE SEGUIR SIENDO MATRIMONIO, Y SI ES SOLTERO/A TAMBIEN DEBE SEGUIR SIENDO ASI.

  - ¿En esta primera etapa quieres que implemente también la lógica completa de **edición** de matrimonios/hermanos, o por ahora solo la lógica de **creación** dejando la edición para otra tarea?

  - DE HECHO SI IMPLEMENTEMOS PRIMERAMENTE LA CREACION, Y LUEGO LA EDICION.

LOS POST EN BROTHERS SIEMPRE SERA UNA SOLA FILA, SI ES MATRIMONIO SE CREAN DOS FILAS DE BROTHERS, SOLAMENTE AL MOMENTOS DE TRAER ES LA INFORMACION DE LA DB ES QUE SE UNEN AMBOS HERMANOS.

UTILIZA showNotification PARA MOSTRAR MENSAJES DE EXITO O ERROR SEGUN CORRESPONDA.

## Secondarias

- [] Si una comundad ya tiene un hermano o un matrimonio que tenga el rol de responsable de comunidad, no permitir que otro hermano o matrimonio pueda tener ese mismo rol. Por lo que el rol de responsable es unico (Podriamos mejorarlo desde el backend).

- [] Podriamos hacer tambien que el numero de telefono sea unico ya que en la realidad no deberia haber dos personas con el mismo numero de telefono.

- [] En todos los formularios, buttons de reset y clear deben estar siempre desahabilitados hasta que el usuario escriba algo en algun input del formulario.

- [] En el archivo page/parishes/[id] falta aplicar los filtros para filtrar comunidades por numeros pares e impares, por paso, y por nombre del responsable.

- [] 