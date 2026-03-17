import { FC } from 'react';

interface ShortcutsHelpProps {
    onClose: () => void;
}

const groups = [
    {
        label: 'Navigation',
        shortcuts: [
            { keys: ['t'], desc: 'Go to today' },
            { keys: ['←', '→'], desc: 'Move to previous / next day' },
            { keys: ['Ctrl', '←'], desc: 'Previous week' },
            { keys: ['Ctrl', '→'], desc: 'Next week' },
        ],
    },
    {
        label: 'Tasks',
        shortcuts: [
            { keys: ['n'], desc: 'New task in focused column' },
            { keys: ['Enter'], desc: 'Confirm task (when input is open)' },
            { keys: ['Escape'], desc: 'Cancel / close' },
        ],
    },
    {
        label: 'App',
        shortcuts: [
            { keys: ['Ctrl', 'K'], desc: 'Open command palette' },
            { keys: ['?'], desc: 'Show this help' },
        ],
    },
];

export const ShortcutsHelp: FC<ShortcutsHelpProps> = ({ onClose }) => {
    return (
        <div className="shortcuts-overlay" onClick={onClose} role="dialog" aria-modal aria-label="Keyboard shortcuts">
            <div className="shortcuts-panel" onClick={(e) => e.stopPropagation()}>
                <div className="shortcuts-header">
                    <h2 className="shortcuts-title">Keyboard Shortcuts</h2>
                    <button className="shortcuts-close" onClick={onClose} aria-label="Close">✕</button>
                </div>
                <div className="shortcuts-body">
                    {groups.map((group) => (
                        <div key={group.label} className="shortcuts-group">
                            <div className="shortcuts-group-label">{group.label}</div>
                            {group.shortcuts.map((s) => (
                                <div key={s.desc} className="shortcuts-row">
                                    <span className="shortcuts-desc">{s.desc}</span>
                                    <span className="shortcuts-keys">
                                        {s.keys.map((k, i) => (
                                            <span key={k}>
                                                <kbd className="shortcuts-kbd">{k}</kbd>
                                                {i < s.keys.length - 1 && <span className="shortcuts-plus">+</span>}
                                            </span>
                                        ))}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="shortcuts-footer">Press <kbd className="shortcuts-kbd">?</kbd> or <kbd className="shortcuts-kbd">Esc</kbd> to close</div>
            </div>
        </div>
    );
};
