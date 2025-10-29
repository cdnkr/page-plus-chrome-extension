export interface IStatusMessage {
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    description?: string
    action?: {
        label: string,
        onClick: (...args: any) => void;
    }
}
  