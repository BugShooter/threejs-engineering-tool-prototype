(function() {
  const tool = window.EngineeringTool;
  const messages = {
    document: {
      title: '3D Конструктор v4'
    },
    locale: {
      code: 'RU',
      name: 'Русский'
    },
    common: {
      dash: '—',
      on: 'ВКЛ',
      off: 'ВЫКЛ',
      mm: 'мм',
      lmb: 'ЛКМ',
      rmb: 'ПКМ'
    },
    topbar: {
      title: '3D Конструктор',
      subtitle: 'Рабочая область',
      language: 'Язык',
      profileName: 'Гость',
      profileMeta: 'Заглушка профиля'
    },
    legacy: {
      heading: '⬡ Конструктор 3D',
      sections: {
        add: 'Добавить',
        selected: 'Выбрано',
        connection: 'Связь',
        strategy: 'Стратегия',
        alignment: 'Привязка',
        debug: 'Отладка',
        file: 'Файл'
      },
      fields: {
        length: 'Длина'
      },
      hintHtml: '<b>Гизмо:</b><br>Цветные оси → перемещение<br>Кольца → вращение<br>Белые стрелки → длина профиля<br><br><b>Клик по детали / связи</b> → выноска<br><b>Потянуть деталь</b> → перетаскивание без выноски<br><b>Соединить</b> → выбрать исходный порт, затем цель<br><b>Esc</b> → снять выделение / отменить действие<br><br><b>ЛКМ</b> пусто → орбита<br><b>ПКМ</b> → панорама<br><b>Колесо</b> → зум'
    },
    actions: {
      profile: 'Профиль',
      angle: 'Соед. угловой',
      straight: 'Соед. прямой',
      addAndEditLength: 'Добавить и настроить длину',
      connect: 'Соединить',
      disconnect: 'Отсоединить деталь',
      selectConnectedStructure: 'Выбрать структуру',
      deleteStructure: 'Удалить структуру',
      delete: 'Удалить',
      split: 'Разорвать связь',
      alignment: 'Выравнивание',
      resetView: 'Сбросить вид',
      portDebug: 'Отладка портов',
      exportJson: 'Экспорт JSON',
      importJson: 'Импорт JSON',
      undoStep: 'Отменить шаг',
      redoStep: 'Повторить шаг',
      clearHistory: 'Очистить историю',
      clearScene: 'Очистить сцену',
      saveSelectionToCatalog: 'Сохранить выбор',
      saveSceneToCatalog: 'Сохранить сцену',
      removeFromCatalog: 'Удалить',
      renameCatalogEntry: 'Переименовать',
      previous: 'Пред.',
      next: 'След.',
      done: 'Готово',
      cancel: 'Отмена'
    },
    debug: {
      commonFlags: 'Общие флаги',
      showRay: 'Луч',
      showHitPoint: 'Точка попадания',
      showPortNormal: 'Нормаль',
      showExactPlane: 'Точная плоскость',
      showLiftedOverlay: 'Поднятый оверлей',
      showContactFootprint: 'Контактный след',
      showShortlist: 'Короткий список при наведении'
    },
    strategies: {
      visibleHidden: 'Видимый / Скрытый'
    },
    partTypes: {
      profile20x20: 'Профиль 20x20',
      connectorStraight20: 'Соед. прямой',
      connectorAngle20: 'Соед. угловой'
    },
    visibleHiddenDebug: {
      showVisibleCandidates: 'Видимые кандидаты',
      showHiddenCandidates: 'Скрытые кандидаты',
      showHiddenActivationZone: 'Зона активации скрытых',
      showScreenPolygons: 'Экранные полигоны',
      showCandidateScores: 'Оценки кандидатов',
      visibleScreenMargin: 'Видимый отступ',
      visibleLockDistance: 'Видимая фиксация',
      hiddenRayThresholdFixed: 'Скрытый фиксированный',
      hiddenRayThresholdTrack: 'Скрытый направляющий',
      hiddenPartThreshold: 'Дистанция скрытой детали'
    },
    project: {
      tab: 'Проект',
      exportCaption: 'Сохранить текущее состояние сборки',
      importCaption: 'Загрузить ранее сохраненный проект'
    },
    settings: {
      tab: 'Настройки',
      targetStrategy: 'Стратегия выбора цели',
      undoHistory: 'История отмены',
      limit: 'Лимит',
      undoDepth: 'Шагов назад / вперёд: {{undoCount}} / {{redoCount}} · лимит {{limit}}',
      undoActionCaption: 'Вернуться на один шаг назад',
      redoActionCaption: 'Вернуться на один шаг вперёд',
      clearHistoryCaption: 'Сбросить накопленные снимки состояния'
    },
    dialogs: {
      clearSceneConfirm: 'Очистить сцену? Это действие можно отменить.'
    },
    widgets: {
      structure: 'Структура',
      catalog: 'Каталог',
      savedAssemblies: 'Сохранённые',
      assemblies: 'Сборки',
      parts: 'Детали',
      library: 'Библиотека',
      add: 'Добавить',
      part: 'Деталь',
      joint: 'Связь',
      properties: 'Свойства',
      hints: 'Подсказки',
      targetDebug: 'Отладка выбора цели',
      targetDebugNote: 'Диагностика вынесена в боковую шторку, чтобы не занимать основные вкладки. Настройки сгруппированы вертикально и растягиваются на всю ширину шторки.',
      noData: 'Нет данных',
      structureEmpty: 'В сцене нет деталей',
      partEmpty: 'Деталь не выбрана',
      jointEmpty: 'Связь не выбрана',
      propertiesEmpty: 'Выберите деталь или связь',
      propertiesPorts: 'Порты',
      propertiesLinkedParts: 'Связанные детали',
      portReady: 'Свободен для соединения',
      portPassive: 'Только целевой порт',
      selectStructureCaption: 'Выбрать связанную структуру',
      deleteStructureCaption: 'Удалить всю связанную структуру',
      choosePortCaption: 'Выбрать порт',
      disconnectCaption: 'Убрать связи',
      deleteCaption: 'Удалить выбранную деталь'
    },
    catalog: {
      note: 'Сохранённые сборки остаются в этом браузере и позже смогут переиспользоваться.',
      empty: 'Сохранённых сборок пока нет',
      editorTitle: 'Сохранение в каталог',
      saveSelectionCaption: 'Сохранить выбранную связанную подсборку',
      saveSceneCaption: 'Сохранить текущую сцену как элемент каталога',
      insertCaption: 'Кликните, чтобы добавить эту сборку в сцену',
      confirmCaption: 'Сохранить эту запись каталога',
      cancelCaption: 'Закрыть форму сохранения',
      removeCaption: 'Удалить эту сохранённую запись',
      renameCaption: 'Обновить название сохранённой сборки',
      storageUnavailable: 'Хранилище браузера недоступно в этой сессии.',
      modalNote: 'Проверьте превью и при необходимости отредактируйте название сборки перед сохранением в каталог.',
      manageTitle: 'Сборка',
      manageModalNote: 'Проверьте превью, переименуйте сборку или удалите её из каталога.',
      nameLabel: 'Название',
      defaultNameBase: 'Сборка',
      namePromptSelection: 'Название для сохранённой подсборки:',
      namePromptScene: 'Название для сохранённой сцены:',
      groupPrompt: 'Необязательное имя группы для связанных деталей позже:',
      removeConfirm: 'Удалить "{{name}}" из каталога?',
      unnamed: 'Сборка без названия',
      defaultSceneName: 'Сборка сцены',
      defaultSelectionName: 'Подсборка {{label}}',
      groupLabel: 'Группа',
      ungrouped: 'Без группы',
      parts: 'Детали',
      scopeLabel: 'Тип',
      scopeScene: 'Сцена',
      scopeSelection: 'Подсборка'
    },
    status: {
      mode: 'Режим',
      snap: 'Привязка',
      snapActive: '⊕ АКТИВНА',
      snapBadge: '⊕ ПРИВЯЗКА'
    },
    hints: {
      line1: 'Гизмо: оси → перемещение, кольца → вращение, белые стрелки → длина',
      line2: 'Клик по детали или связи → выноска',
      line3: 'Потянуть деталь → перетаскивание без выноски',
      line4: 'Соединить → выбрать порт, затем цель',
      line5: 'Esc → снять выделение или отменить действие',
      line6: 'ЛКМ пусто → орбита, ПКМ → панорама, колесо → зум'
    },
    modes: {
      moveAxis: 'Перемещение {axis}',
      rotateAxis: 'Поворот {axis}',
      lengthEnd: 'Длина {end}',
      connected: 'Соединено',
      adjusted: 'Скорректировано',
      adjustJoint: 'Настройка соединения',
      noSourcePort: 'Нет исходного порта',
      connect: 'Соединение',
      connectTarget: 'Цель соединения',
      resizeLocked: 'Изменение размера заблокировано',
      drag: 'Перетаскивание',
      joint: 'Соединение',
      select: 'Выбор',
      orbit: 'Орбита'
    },
    tooltips: {
      closeFullscreen: 'Закрыть полноэкранный режим',
      exitFullscreen: 'Выйти из полноэкранного режима',
      enterFullscreen: 'Развернуть почти на весь canvas',
      expandPanel: 'Развернуть панель',
      collapsePanel: 'Свернуть панель',
      showPanel: 'Показать панель: {label}',
      hidePanel: 'Скрыть панель: {label}'
    },
    hud: {
      target: 'Цель',
      snap: 'Привязка',
      end: 'Торец',
      delta: 'Δ',
      axis: 'Ось',
      angle: 'Угол',
      mode: 'Режим',
      step: 'Шаг',
      available: 'Доступно',
      orientation: 'Ориентация',
      switch: 'Смена',
      source: 'Источник',
      confirm: 'Подтверждение',
      chooseSourcePort: 'Выберите исходный порт',
      hoverPort: 'Наведите курсор на порт'
    },
    reasons: {
      resizeOnlyProfile: 'Изменение размера доступно только для профиля.',
      resizeFreeEndOnly: 'Тянуть можно только свободный торец профиля.',
      jointNotFound: 'Соединение не найдено',
      adjustSideNotInJoint: 'Сторона не относится к выбранной связи',
      adjustLockedLoop: 'Сторона заблокирована: соединение входит в замкнутый контур',
      adjustMissingSubassembly: 'Не удалось собрать подузел для корректировки',
      adjustSourcePortUnavailable: 'Порт выбранной стороны недоступен для корректировки',
      adjustMissingOtherSide: 'Не удалось восстановить вторую сторону соединения',
      adjustOnlyOneOrientation: 'Для этой стороны доступна только одна ориентация',
      adjustMissingVariants: 'Не удалось восстановить варианты ориентации'
    },
    callout: {
      position: 'Позиция',
      explicitConnectMode: 'Режим явного соединения через выбор порта',
      noFreeSourcePort: 'Нет свободного исходного порта для соединения',
      moveMode: 'Режим перемещения',
      rotateMode: 'Режим вращения',
      lengthMode: 'Режим изменения длины',
      lengthModeBlocked: 'Нужен свободный торец профиля для изменения длины',
      disconnectSelectedPart: 'Отсоединить выбранную деталь',
      selectConnectedStructure: 'Выбрать связанную структуру',
      selectSinglePart: 'Вернуться к выбору одной детали',
      deleteSelectedStructure: 'Удалить выбранную структуру',
      deleteSelectedPart: 'Удалить выбранную деталь',
      adjustConnectionTitle: 'Корректировка соединения',
      side: 'Сторона',
      previewNewOrientation: 'Предпросмотр: новая ориентация',
      previewCurrentPosition: 'Предпросмотр: текущее положение',
      previousOrientation: 'Предыдущая ориентация (←)',
      nextOrientation: 'Следующая ориентация (→)',
      applyOrientation: 'Применить ориентацию (Enter / ЛКМ)',
      cancelAdjustment: 'Отменить корректировку (Esc)',
      openLengthEditor: 'Открыть свойства и сфокусироваться на длине',
      openProperties: 'Открыть свойства',
      closeCallout: 'Закрыть коллаут',
      connectionTitle: 'Соединение {id}',
      rotateSide: 'Повернуть {side}: {part}',
      split: 'Разорвать',
      splitSelectedJoint: 'Разорвать выбранную связь'
    },
    selection: {
      length: 'Длина',
      connections: 'Соединения',
      subassembly: 'Подсборка'
    },
    joint: {
      rule: 'Правило'
    }
  };

  tool.i18n.instance.registerLocale('ru', messages);
})();