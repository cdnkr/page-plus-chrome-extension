export const i18n = {
    en: {
      languageSelector: {
        label: "Language",
      },
      apiStatus: {
        title: "On-Device AI Availability",
        description:
          "The following Chrome browser APIs are required to use on-device AI models like Gemini Nano.",
        googlePromptApi: {
          title: "Prompt (Gemini Nano)",
          description:
            "This extension can use this API for on-device text, image, and page analysis and actions.",
          unavailable: {
            message:
              "This experimental feature requires enabling the Prompt API for Gemini Nano in Chrome flags.",
            instructions:
              "Search for 'Prompt API' in Chrome flags, enable it, and restart Chrome.",
            fallback:
              "If unavailable, Google’s cloud-based Gemini Flash model will be used instead.",
            openFlagsButton: "Open Chrome Flags",
          },
        },
        summarizerApi: {
          title: "Summarizer (Gemini Nano)",
          description:
            "On-device summarization API, independent from the Prompt API.",
          unavailable: {
            message:
              "Summarizer API is unavailable. Make sure Chrome flags and device requirements are met.",
            openFlagsButton: "Open Flags",
            separateAvailability:
              "The Summarizer API is downloaded and managed separately from the Prompt API.",
          },
        },
        writerApi: {
          title: "Writer (Gemini Nano)",
          description:
            "On-device content writing API, independent from the Prompt API.",
          unavailable: {
            message:
              "Writer API is unavailable. Make sure Chrome flags and device requirements are met.",
            openFlagsButton: "Open Flags",
            separateAvailability:
              "The Writer API is downloaded and managed separately from the Prompt API.",
          },
        },
      },
      inputSection: {
        placeholder: "What would you like to know?",
      },
      pageSuggestions: {
        gettingSuggestionsForThisPage: "Getting suggestions for this page...",
        suggestionsFor: "Suggestions for",
      },
      history: {
        justNow: "Just now",
        minute: { one: "minute", other: "minutes" },
        hour: { one: "hour", other: "hours" },
        ago: "ago",
        messages: { one: "message", other: "messages" },
      },
      tools: {
        imageZipDownload: {
          expiresIn: "Expires in",
          expired: "Expired",
          pageImages: "Page Images",
          images: "images",
          second: { one: "second", other: "seconds" },
          minute: { one: "minute", other: "minutes" },
          hour: { one: "hour", other: "hours" },
          day: { one: "day", other: "days" },
        },
      },
      formTool: {
        noInputElementsFound: "No input fields found in this context.",
        warningCouldNotAnalyze:
          "Warning: Could not analyze form fields using AI.",
        unknownError: "Unknown error",
        attemptingFallbackMapping: "Attempting fallback field mapping...",
        noSuitableDataFound:
          "No suitable data found to fill the input fields.",
        inputFound: { one: "input field has", other: "input fields have" },
        beenFoundInSelectedArea: "been found in the selected area.",
        willBeFilling: "I’ll be filling",
        formField: { one: "form field", other: "form fields" },
        with: "with",
        formFieldsFilledSuccessfully: "Form fields were filled successfully.",
        errorFillingForm: "Error filling form:",
        error: "Error:",
      },
      options: {
        title: "Options",
        description: "Extension settings and options.",
        summarizeByDefault: {
          label: "Summarize by default",
          description:
            "If enabled, page or text added to chat as context will be summarized when longer than {threshold} characters.",
        },
      },
    },
  
    es: {
      languageSelector: {
        label: "Idioma",
      },
      apiStatus: {
        title: "Disponibilidad de IA en el dispositivo",
        description:
          "Las siguientes API de Chrome son necesarias para usar los modelos de IA locales, como Gemini Nano.",
        googlePromptApi: {
          title: "Prompt (Gemini Nano)",
          description:
            "Esta extensión puede usar esta API para análisis y acciones de texto, imagen y página en el dispositivo.",
          unavailable: {
            message:
              "Esta función experimental requiere habilitar la bandera 'Prompt API for Gemini Nano' en Chrome.",
            instructions:
              "Busca 'Prompt API' en las banderas de Chrome, habilítala y reinicia el navegador.",
            fallback:
              "Si no está disponible, se usará el modelo Gemini Flash basado en la nube de Google.",
            openFlagsButton: "Abrir banderas de Chrome",
          },
        },
        summarizerApi: {
          title: "Resumidor (Gemini Nano)",
          description:
            "API de resumen en el dispositivo, independiente de la API de Prompt.",
          unavailable: {
            message:
              "La API de resumen no está disponible. Asegúrate de que las banderas de Chrome y los requisitos del dispositivo se cumplan.",
            openFlagsButton: "Abrir banderas",
            separateAvailability:
              "La API de resumen se descarga y administra por separado de la API de Prompt.",
          },
        },
        writerApi: {
          title: "Escritor (Gemini Nano)",
          description:
            "API de redacción de contenido en el dispositivo, independiente de la API de Prompt.",
          unavailable: {
            message:
              "La API de escritor no está disponible. Asegúrate de que las banderas de Chrome y los requisitos del dispositivo se cumplan.",
            openFlagsButton: "Abrir banderas",
            separateAvailability:
              "La API de escritor se descarga y administra por separado de la API de Prompt.",
          },
        },
      },
      inputSection: {
        placeholder: "¿Qué te gustaría saber?",
      },
      pageSuggestions: {
        gettingSuggestionsForThisPage:
          "Obteniendo sugerencias para esta página...",
        suggestionsFor: "Sugerencias para",
      },
      history: {
        justNow: "Justo ahora",
        minute: { one: "minuto", other: "minutos" },
        hour: { one: "hora", other: "horas" },
        ago: "hace",
        messages: { one: "mensaje", other: "mensajes" },
      },
      tools: {
        imageZipDownload: {
          expiresIn: "Expira en",
          expired: "Expirado",
          pageImages: "Imágenes de la página",
          images: "imágenes",
          second: { one: "segundo", other: "segundos" },
          minute: { one: "minuto", other: "minutos" },
          hour: { one: "hora", other: "horas" },
          day: { one: "día", other: "días" },
        },
      },
      formTool: {
        noInputElementsFound:
          "No se encontraron campos de entrada en este contexto.",
        warningCouldNotAnalyze:
          "Advertencia: No se pudieron analizar los campos del formulario con IA.",
        unknownError: "Error desconocido",
        attemptingFallbackMapping: "Intentando mapeo alternativo...",
        noSuitableDataFound:
          "No se encontraron datos adecuados para llenar los campos.",
        inputFound: { one: "campo de entrada ha", other: "campos de entrada han" },
        beenFoundInSelectedArea: "sido encontrados en el área seleccionada.",
        willBeFilling: "Voy a llenar",
        formField: { one: "campo del formulario", other: "campos del formulario" },
        with: "con",
        formFieldsFilledSuccessfully:
          "Los campos del formulario se llenaron correctamente.",
        errorFillingForm: "Error al llenar el formulario:",
        error: "Error:",
      },
      options: {
        title: "Opciones",
        description: "Configuración de la extensión.",
        summarizeByDefault: {
          label: "Resumir por defecto",
          description:
            "Si está activado, el texto o la página añadidos al chat se resumirán si superan los {threshold} caracteres.",
        },
      },
    },
  
    ja: {
      languageSelector: {
        label: "言語",
      },
      apiStatus: {
        title: "オンデバイスAIの利用状況",
        description:
          "ChromeのオンデバイスAIモデル（Gemini Nanoなど）を使用するには、次のブラウザAPIが必要です。",
        googlePromptApi: {
          title: "プロンプト (Gemini Nano)",
          description:
            "この拡張機能は、オンデバイスでテキスト・画像・ページの解析や操作を行うためにこのAPIを使用できます。",
          unavailable: {
            message:
              "この実験的機能を使用するには、Chromeのフラグで「Prompt API for Gemini Nano」を有効にする必要があります。",
            instructions:
              "Chromeフラグで「Prompt API」を検索し、有効にしてからChromeを再起動してください。",
            fallback:
              "利用できない場合は、Googleのクラウド版Gemini Flashモデルが使用されます。",
            openFlagsButton: "Chromeフラグを開く",
          },
        },
        summarizerApi: {
          title: "要約 (Gemini Nano)",
          description:
            "オンデバイスの要約APIです。Prompt APIとは独立して動作します。",
          unavailable: {
            message:
              "要約APIが利用できません。Chromeフラグとデバイス要件を確認してください。",
            openFlagsButton: "フラグを開く",
            separateAvailability:
              "要約APIはPrompt APIとは別にダウンロード・管理されます。",
          },
        },
        writerApi: {
          title: "ライター (Gemini Nano)",
          description:
            "オンデバイスのコンテンツ作成APIです。Prompt APIとは独立しています。",
          unavailable: {
            message:
              "ライターAPIが利用できません。Chromeフラグとデバイス要件を確認してください。",
            openFlagsButton: "フラグを開く",
            separateAvailability:
              "ライターAPIはPrompt APIとは別にダウンロード・管理されます。",
          },
        },
      },
      inputSection: {
        placeholder: "何を知りたいですか？",
      },
      pageSuggestions: {
        gettingSuggestionsForThisPage: "このページの提案を取得中...",
        suggestionsFor: "提案対象:",
      },
      history: {
        justNow: "たった今",
        minute: { one: "分", other: "分" },
        hour: { one: "時間", other: "時間" },
        ago: "前",
        messages: { one: "メッセージ", other: "メッセージ" },
      },
      tools: {
        imageZipDownload: {
          expiresIn: "有効期限:",
          expired: "期限切れ",
          pageImages: "ページの画像",
          images: "画像",
          second: { one: "秒", other: "秒" },
          minute: { one: "分", other: "分" },
          hour: { one: "時間", other: "時間" },
          day: { one: "日", other: "日" },
        },
      },
      formTool: {
        noInputElementsFound: "入力フィールドが見つかりませんでした。",
        warningCouldNotAnalyze: "警告: AIでフォームフィールドを解析できませんでした。",
        unknownError: "不明なエラー",
        attemptingFallbackMapping: "代替マッピングを試行中...",
        noSuitableDataFound: "入力フィールドを埋める適切なデータが見つかりません。",
        inputFound: { one: "入力フィールドが", other: "入力フィールドが" },
        beenFoundInSelectedArea: "選択領域で見つかりました。",
        willBeFilling: "次のフィールドを入力します:",
        formField: { one: "フォームフィールド", other: "フォームフィールド" },
        with: "内容:",
        formFieldsFilledSuccessfully: "フォームフィールドを正常に入力しました。",
        errorFillingForm: "フォーム入力エラー:",
        error: "エラー:",
      },
      options: {
        title: "オプション",
        description: "拡張機能の設定。",
        summarizeByDefault: {
          label: "デフォルトで要約する",
          description:
            "ページやテキストが{threshold}文字を超える場合、自動的に要約します。",
        },
      },
    },
  }
  
  export const LANGUAGE_NAMES = {
    en: "English",
    es: "Español",
    ja: "日本語",
  }
  