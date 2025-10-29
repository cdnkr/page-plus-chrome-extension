export const i18n = {
    en: {
        languageSelector: {
            label: "Language",
        },
        apiStatus: {
            title: "On-Device API Availability",
            description: "The following browser based APIs in Chrome are needed to use the Chrome on-device AI models.",
            googlePromptApi: {
                title: "Google Prompt API",
                description: "This extension can use this API for on-device Text, Image and Page analysis and actions.",
                unavailable: {
                    message: "This experimental feature requires enabling the Prompt API for Gemini Nano Chrome flag",
                    instructions: "Search for Prompt API in flags, enable it, then restart Chrome.",
                    fallback: "Google's cloud based Gemini Flash model will be used as a fallback.",
                    openFlagsButton: "Open Chrome Flags"
                }
            }
        },
        inputSection: {
            placeholder: "What would you like to know?",
        },
        pageSuggestions: {
            gettingSuggestionsForThisPage: "Getting suggestions for this page.",
            suggestionsFor: "Suggestions for",
        },
        history: {
            justNow: "Just now",
            minute: {
                one: "minute",
                other: "minutes"
            },
            hour: {
                one: "hour", 
                other: "hours"
            },
            ago: "ago",
            messages: {
                one: "message",
                other: "messages"
            },
        },
        tools: {
            imageZipDownload: {
                expiresIn: "Expires in",
                expired: "Expired",
                pageImages: "Page Images",
                images: "images",
                second: {
                    one: "second",
                    other: "seconds"
                },
                minute: {
                    one: "minute", 
                    other: "minutes"
                },
                hour: {
                    one: "hour",
                    other: "hours"
                },
                day: {
                    one: "day",
                    other: "days"
                }
            }
        },
        formTool: {
            noInputElementsFound: "No input elements found in context.",
            warningCouldNotAnalyze: "Warning: Could not analyze form fields with AI.",
            unknownError: "Unknown error",
            attemptingFallbackMapping: "Attempting fallback field mapping...",
            noSuitableDataFound: "No suitable data found to fill the input fields.",
            inputFound: {
                one: "input has",
                other: "inputs have"
            },
            beenFoundInSelectedArea: "been found in the selected area.",
            willBeFilling: "I'll be filling",
            formField: {
                one: "form field",
                other: "form fields"
            },
            with: "with",
            formFieldsFilledSuccessfully: "The form fields have been filled successfully.",
            errorFillingForm: "Error filling form:",
            error: "Error:"
        },
        options: {
            title: "Options",
            description: "Options for the extension.",
            summarizeByDefault: {
                label: "Summarize by default",
                description: "Determines if page and text added to chat as context should be summarized if they are over {threshold} characters long.",
            }
        }
    },
    es: {
        languageSelector: {
            label: "Idioma",
        },
        apiStatus: {
            title: "Disponibilidad de API en el Dispositivo",
            description: "Las siguientes APIs basadas en el navegador en Chrome son necesarias para usar los modelos de IA en el dispositivo de Chrome.",
            googlePromptApi: {
                title: "API de Prompt de Google",
                description: "Esta extensión puede usar esta API para análisis y acciones de Texto, Imagen y Página en el dispositivo.",
                unavailable: {
                    message: "Esta característica experimental requiere habilitar la bandera de Chrome Prompt API for Gemini Nano",
                    instructions: "Busca Prompt API en las banderas, habilítala, luego reinicia Chrome.",
                    fallback: "El modelo Gemini Flash basado en la nube de Google se usará como respaldo.",
                    openFlagsButton: "Abrir Banderas de Chrome"
                }
            }
        },
        inputSection: {
            placeholder: "¿Qué te gustaría saber?",
        },
        pageSuggestions: {
            gettingSuggestionsForThisPage: "Obteniendo sugerencias para esta página.",
            suggestionsFor: "Sugerencias para",
        },
        history: {
            justNow: "Justo ahora",
            minute: {
                one: "minuto",
                other: "minutos"
            },
            hour: {
                one: "hora",
                other: "horas"
            },
            ago: "atrás",
            messages: {
                one: "mensaje",
                other: "mensajes"
            },
        },
        tools: {
            imageZipDownload: {
                expiresIn: "Expira en",
                expired: "Expirado",
                pageImages: "Imágenes de Página",
                images: "imágenes",
                second: {
                    one: "segundo",
                    other: "segundos"
                },
                minute: {
                    one: "minuto", 
                    other: "minutos"
                },
                hour: {
                    one: "hora",
                    other: "horas"
                },
                day: {
                    one: "día",
                    other: "días"
                }
            }
        },
        formTool: {
            noInputElementsFound: "No se encontraron elementos de entrada en el contexto.",
            warningCouldNotAnalyze: "Advertencia: No se pudieron analizar los campos del formulario con IA.",
            unknownError: "Error desconocido",
            attemptingFallbackMapping: "Intentando mapeo de campos de respaldo...",
            noSuitableDataFound: "No se encontraron datos adecuados para llenar los campos de entrada.",
            inputFound: {
                one: "entrada tiene",
                other: "entradas tienen"
            },
            beenFoundInSelectedArea: "han sido encontradas en el área seleccionada.",
            willBeFilling: "Voy a llenar",
            formField: {
                one: "campo del formulario",
                other: "campos del formulario"
            },
            with: "con",
            formFieldsFilledSuccessfully: "Los campos del formulario han sido llenados exitosamente.",
            errorFillingForm: "Error llenando formulario:",
            error: "Error:"
        },
        options: {
            title: "Opciones",
            description: "Opciones para la extensión.",
            summarizeByDefault: {
                label: "Resumir por defecto",
                description: "Determina si la página y el texto agregados al chat como contexto deben ser resumidos si tienen más de {threshold} caracteres.",
            }
        }
    },
    ja: {
        languageSelector: {
            label: "言語",
        },
        apiStatus: {
            title: "オンデバイスAPIの可用性",
            description: "ChromeのオンデバイスAIモデルを使用するには、Chromeの以下のブラウザベースAPIが必要です。",
            googlePromptApi: {
                title: "Google Prompt API",
                description: "この拡張機能は、オンデバイスのテキスト、画像、ページの分析とアクションにこのAPIを使用できます。",
                unavailable: {
                    message: "この実験的機能には、Chromeフラグ「Prompt API for Gemini Nano」の有効化が必要です",
                    instructions: "フラグで「Prompt API」を検索し、有効にしてからChromeを再起動してください。",
                    fallback: "GoogleのクラウドベースのGemini Flashモデルがフォールバックとして使用されます。",
                    openFlagsButton: "Chromeフラグを開く"
                }
            }
        },
        inputSection: {
            placeholder: "何を知りたいですか？",
        },
        pageSuggestions: {
            gettingSuggestionsForThisPage: "このページの提案を取得しています。",
            suggestionsFor: "提案は",
        },
        history: {
            justNow: "今",
            minute: {
                one: "分",
                other: "分"
            },
            hour: {
                one: "時間",
                other: "時間"
            },
            ago: "前",
            messages: {
                one: "メッセージ",
                other: "メッセージ"
            },
        },
        tools: {
            imageZipDownload: {
                expiresIn: "有効期限",
                expired: "期限切れ",
                pageImages: "ページ画像",
                images: "画像",
                second: {
                    one: "秒",
                    other: "秒"
                },
                minute: {
                    one: "分", 
                    other: "分"
                },
                hour: {
                    one: "時間",
                    other: "時間"
                },
                day: {
                    one: "日",
                    other: "日"
                }
            }
        },
        formTool: {
            noInputElementsFound: "コンテキストに入力要素が見つかりません。",
            warningCouldNotAnalyze: "警告: AIでフォームフィールドを分析できませんでした。",
            unknownError: "不明なエラー",
            attemptingFallbackMapping: "フォールバックフィールドマッピングを試行中...",
            noSuitableDataFound: "入力フィールドを埋めるのに適したデータが見つかりません。",
            inputFound: {
                one: "入力が",
                other: "入力が"
            },
            beenFoundInSelectedArea: "選択された領域で見つかりました。",
            willBeFilling: "フォームフィールドを埋めます",
            formField: {
                one: "フォームフィールド",
                other: "フォームフィールド"
            },
            with: "で",
            formFieldsFilledSuccessfully: "フォームフィールドが正常に埋められました。",
            errorFillingForm: "フォーム入力エラー:",
            error: "エラー:"
        },
        options: {
            title: "オプション",
            description: "オプションは、拡張機能のオプションです。",
            summarizeByDefault: {
                label: "デフォルトで要約",
                description: "チャットにコンテキストとして追加されたページとテキストが {threshold} 文字を超える場合、要約するかどうかを決定します。",
            }
        }
    },
}

export const LANGUAGE_NAMES = {
    en: "English",
    es: "Español",
    ja: "日本語",
}