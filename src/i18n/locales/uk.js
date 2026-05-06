(function() {
  const tool = window.EngineeringTool;
  const messages = {
    document: {
      title: '3D Інженерний Інструмент v4'
    },
    locale: {
      code: 'UK',
      name: 'Українська'
    },
    common: {
      dash: '—',
      on: 'УВІМК',
      off: 'ВИМК',
      mm: 'мм',
      lmb: 'ЛКМ',
      rmb: 'ПКМ'
    },
    topbar: {
      title: '3D Інженерний Інструмент',
      subtitle: 'Робочий простір',
      language: 'Мова',
      profileName: 'Гість',
      profileMeta: 'Заглушка профілю'
    },
    legacy: {
      heading: '⬡ Конструктор 3D',
      sections: {
        add: 'Додати',
        selected: 'Вибрано',
        connection: 'Звʼязок',
        strategy: 'Стратегія',
        alignment: 'Привʼязка',
        debug: 'Налагодження',
        file: 'Файл'
      },
      fields: {
        length: 'Довжина'
      },
      hintHtml: '<b>Гізмо:</b><br>Кольорові осі → переміщення<br>Кільця → обертання<br>Білі стрілки → довжина профілю<br><br><b>Клік по деталі / звʼязку</b> → виноска<br><b>Потягнути деталь</b> → перетягування без виноски<br><b>Зʼєднати</b> → вибрати вихідний порт, потім цільовий<br><b>Esc</b> → зняти вибір / скасувати дію<br><br><b>ЛКМ</b> порожньо → орбіта<br><b>ПКМ</b> → панорама<br><b>Колесо</b> → зум'
    },
    actions: {
      profile: 'Профіль',
      angle: 'Кутовий зʼєднувач',
      straight: 'Прямий зʼєднувач',
      connect: 'Зʼєднати',
      disconnect: 'Відʼєднати деталь',
      selectConnectedStructure: 'Вибрати структуру',
      deleteStructure: 'Видалити структуру',
      delete: 'Видалити',
      split: 'Розірвати звʼязок',
      alignment: 'Вирівнювання',
      resetView: 'Скинути вигляд',
      portDebug: 'Відладка портів',
      exportJson: 'Експорт JSON',
      importJson: 'Імпорт JSON',
      undoStep: 'Скасувати крок',
      redoStep: 'Повторити крок',
      clearHistory: 'Очистити історію',
      saveSelectionToCatalog: 'Зберегти вибране',
      saveSceneToCatalog: 'Зберегти сцену',
      removeFromCatalog: 'Видалити',
      renameCatalogEntry: 'Перейменувати',
      previous: 'Попер.',
      next: 'Наст.',
      done: 'Готово',
      cancel: 'Скасувати'
    },
    debug: {
      commonFlags: 'Загальні прапорці',
      showRay: 'Промінь',
      showHitPoint: 'Точка влучання',
      showPortNormal: 'Нормаль порту',
      showExactPlane: 'Точна площина',
      showLiftedOverlay: 'Піднятий оверлей',
      showContactFootprint: 'Слід контакту',
      showShortlist: 'Короткий список при наведенні'
    },
    strategies: {
      visibleHidden: 'Видимий / Прихований'
    },
    partTypes: {
      profile20x20: 'Профіль 20x20',
      connectorStraight20: 'Прямий зʼєднувач',
      connectorAngle20: 'Кутовий зʼєднувач'
    },
    visibleHiddenDebug: {
      showVisibleCandidates: 'Видимі кандидати',
      showHiddenCandidates: 'Приховані кандидати',
      showHiddenActivationZone: 'Зона активації прихованих',
      showScreenPolygons: 'Екранні полігони',
      showCandidateScores: 'Оцінки кандидатів',
      visibleScreenMargin: 'Видима межа',
      visibleLockDistance: 'Видиме блокування',
      hiddenRayThresholdFixed: 'Прихований фіксований',
      hiddenRayThresholdTrack: 'Прихований напрямний',
      hiddenPartThreshold: 'Дистанція прихованої деталі'
    },
    project: {
      tab: 'Проєкт',
      exportCaption: 'Зберегти поточний стан збірки',
      importCaption: 'Завантажити збережений файл проєкту'
    },
    settings: {
      tab: 'Налаштування',
      targetStrategy: 'Стратегія вибору цілі',
      undoHistory: 'Історія скасувань',
      limit: 'Ліміт',
      undoDepth: 'Кроків назад / вперед: {{undoCount}} / {{redoCount}} · ліміт {{limit}}',
      undoActionCaption: 'Повернутися на один крок назад',
      redoActionCaption: 'Перейти на один крок вперед',
      clearHistoryCaption: 'Очистити накопичені знімки стану'
    },
    widgets: {
      structure: 'Структура',
      catalog: 'Каталог',
      savedAssemblies: 'Збірки',
      add: 'Додати',
      part: 'Деталь',
      joint: 'Звʼязок',
      hints: 'Підказки',
      targetDebug: 'Відладка вибору цілі',
      targetDebugNote: 'Діагностика винесена в бічну шухляду, щоб не займати основні вкладки. Налаштування згруповані вертикально та розтягуються на всю ширину шухляди.',
      noData: 'Немає даних',
      structureEmpty: 'У сцені немає деталей',
      partEmpty: 'Деталь не вибрана',
      jointEmpty: 'Звʼязок не вибраний',
      selectStructureCaption: 'Вибрати звʼязану структуру',
      deleteStructureCaption: 'Видалити всю звʼязану структуру',
      choosePortCaption: 'Вибрати порт',
      disconnectCaption: 'Прибрати звʼязки',
      deleteCaption: 'Видалити вибрану деталь'
    },
    catalog: {
      note: 'Збережені збірки залишаються в цьому браузері та згодом можуть використовуватися повторно.',
      empty: 'Збережених збірок поки немає',
      editorTitle: 'Збереження в каталог',
      saveSelectionCaption: 'Зберегти вибрану зв’язану підзбірку',
      saveSceneCaption: 'Зберегти поточну сцену як елемент каталогу',
      insertCaption: 'Клікніть, щоб додати цю збірку в сцену',
      confirmCaption: 'Зберегти цей запис каталогу',
      cancelCaption: 'Закрити форму збереження',
      removeCaption: 'Видалити цей збережений запис',
      renameCaption: 'Оновити назву збереженої збірки',
      storageUnavailable: 'Сховище браузера недоступне в цій сесії.',
      modalNote: 'Перевірте прев’ю та за потреби відредагуйте назву збірки перед збереженням до каталогу.',
      manageTitle: 'Збірка',
      manageModalNote: 'Перевірте прев’ю, перейменуйте збірку або видаліть її з каталогу.',
      nameLabel: 'Назва',
      defaultNameBase: 'Збірка',
      namePromptSelection: 'Назва для збереженої підзбірки:',
      namePromptScene: 'Назва для збереженої сцени:',
      groupPrompt: 'Необов’язкова назва групи для пов’язаних деталей пізніше:',
      removeConfirm: 'Видалити "{{name}}" з каталогу?',
      unnamed: 'Збірка без назви',
      defaultSceneName: 'Збірка сцени',
      defaultSelectionName: 'Підзбірка {{label}}',
      groupLabel: 'Група',
      ungrouped: 'Без групи',
      parts: 'Деталі',
      scopeLabel: 'Тип',
      scopeScene: 'Сцена',
      scopeSelection: 'Підзбірка'
    },
    status: {
      mode: 'Режим',
      snap: 'Привʼязка',
      snapActive: '⊕ АКТИВНИЙ',
      snapBadge: '⊕ ПРИВʼЯЗКА'
    },
    hints: {
      line1: 'Гізмо: осі → переміщення, кільця → обертання, білі стрілки → довжина',
      line2: 'Клік по деталі або звʼязку → виноска',
      line3: 'Потягнути деталь → перетягування без виноски',
      line4: 'Зʼєднати → вибрати вихідний порт, потім ціль',
      line5: 'Esc → зняти вибір або скасувати дію',
      line6: 'ЛКМ порожньо → орбіта, ПКМ → панорама, колесо → зум'
    },
    modes: {
      moveAxis: 'Рух {axis}',
      rotateAxis: 'Обертання {axis}',
      lengthEnd: 'Довжина {end}',
      connected: 'Зʼєднано',
      adjusted: 'Скориговано',
      adjustJoint: 'Налаштувати зʼєднання',
      noSourcePort: 'Немає вихідного порту',
      connect: 'Зʼєднання',
      connectTarget: 'Ціль зʼєднання',
      resizeLocked: 'Зміну розміру заблоковано',
      drag: 'Перетягування',
      joint: 'Зʼєднання',
      select: 'Вибір',
      orbit: 'Орбіта'
    },
    tooltips: {
      closeFullscreen: 'Закрити повноекранний режим',
      exitFullscreen: 'Вийти з повноекранного режиму',
      enterFullscreen: 'Розгорнути майже на весь canvas',
      expandPanel: 'Розгорнути панель',
      collapsePanel: 'Згорнути панель',
      showPanel: 'Показати панель: {label}',
      hidePanel: 'Сховати панель: {label}'
    },
    hud: {
      target: 'Ціль',
      snap: 'Привʼязка',
      end: 'Кінець',
      delta: 'Δ',
      axis: 'Вісь',
      angle: 'Кут',
      mode: 'Режим',
      step: 'Крок',
      available: 'Доступно',
      orientation: 'Орієнтація',
      switch: 'Перемикання',
      source: 'Джерело',
      confirm: 'Підтвердження',
      chooseSourcePort: 'Виберіть вихідний порт',
      hoverPort: 'Наведіть курсор на порт'
    },
    reasons: {
      resizeOnlyProfile: 'Зміна розміру доступна лише для профілю.',
      resizeFreeEndOnly: 'Тягнути можна лише вільний кінець профілю.',
      jointNotFound: 'Зʼєднання не знайдено',
      adjustSideNotInJoint: 'Ця сторона не належить до вибраного зʼєднання',
      adjustLockedLoop: 'Ця сторона заблокована, бо зʼєднання входить у замкнений контур',
      adjustMissingSubassembly: 'Не вдалося зібрати підзбірку для коригування',
      adjustSourcePortUnavailable: 'Порт вибраної сторони недоступний для коригування',
      adjustMissingOtherSide: 'Не вдалося відновити іншу сторону зʼєднання',
      adjustOnlyOneOrientation: 'Для цієї сторони доступна лише одна орієнтація',
      adjustMissingVariants: 'Не вдалося відновити варіанти орієнтації'
    },
    callout: {
      position: 'Позиція',
      explicitConnectMode: 'Явний режим зʼєднання через вибір порту',
      noFreeSourcePort: 'Немає вільного вихідного порту для зʼєднання',
      moveMode: 'Режим переміщення',
      rotateMode: 'Режим обертання',
      lengthMode: 'Режим довжини',
      lengthModeBlocked: 'Для зміни довжини потрібен вільний кінець профілю',
      disconnectSelectedPart: 'Відʼєднати вибрану деталь',
      selectConnectedStructure: 'Вибрати звʼязану структуру',
      selectSinglePart: 'Повернутися до вибору однієї деталі',
      deleteSelectedStructure: 'Видалити вибрану структуру',
      deleteSelectedPart: 'Видалити вибрану деталь',
      adjustConnectionTitle: 'Коригування зʼєднання',
      side: 'Сторона',
      previewNewOrientation: 'Попередній перегляд: нова орієнтація',
      previewCurrentPosition: 'Попередній перегляд: поточне положення',
      previousOrientation: 'Попередня орієнтація (←)',
      nextOrientation: 'Наступна орієнтація (→)',
      applyOrientation: 'Застосувати орієнтацію (Enter / ЛКМ)',
      cancelAdjustment: 'Скасувати коригування (Esc)',
      connectionTitle: 'Зʼєднання {id}',
      rotateSide: 'Повернути {side}: {part}',
      split: 'Розірвати',
      splitSelectedJoint: 'Розірвати вибране зʼєднання'
    },
    selection: {
      length: 'Довжина',
      connections: 'Зʼєднання',
      subassembly: 'Підзбірка'
    },
    joint: {
      rule: 'Правило'
    }
  };

  tool.i18n.instance.registerLocale('uk', messages);
})();