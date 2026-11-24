# PulseQuiz design system (dark only)
Direction: late-night arcade scoreboard. Ink backgrounds, one electric lime for actions, coral for urgency. No purple gradients.
## Color
ink #0E1116 page · panel #171C24 cards · line #262D38 borders · text #E8ECF1 · mute #8A94A3 (5.6:1 on ink)
lime #C6F432 primary buttons/active (ink text on it, 13:1) · coral #FF6B4A timer/error
Answers (always with a shape glyph, never color alone): A coral ▲ · B sky #3FB6FF ◆ · C amber #FFC93C ● · D mint #4ADE9A ■
## Type
Inter, system-ui fallback (Cyrillic/Kazakh safe). Sizes 14/16/20/24/32/48/72, weights 500/700/800. Body >= 16px.
## Spacing / shape
4px scale. Radius 12 (inputs, buttons), 20 (cards). No shadows; depth = border + panel color.
## Components
Primary button lime, hover lighter, focus 2px lime ring, disabled 40% opacity. Secondary: panel + line border. Inputs: panel, line border, lime focus ring.
Motion: pop-in on state change, podium rise, timer bar linear. Respect prefers-reduced-motion.
