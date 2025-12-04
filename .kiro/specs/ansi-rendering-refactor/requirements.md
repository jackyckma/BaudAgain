# Requirements Document: ANSI Rendering Architecture Refactor

## Introduction

The BaudAgain BBS system currently has persistent ANSI frame rendering issues where frames appear misaligned in terminals and web browsers. The root cause is architectural - we lack a centralized, reliable mechanism for rendering ANSI content that works consistently across all output contexts (raw terminal, telnet, web terminal emulator, HTML preview).

This spec defines requirements for a robust ANSI rendering architecture that guarantees correct visual output.

## Glossary

- **ANSI Frame**: A box-drawn frame using Unicode box-drawing characters (╔═╗║╚╝) with optional ANSI color codes
- **Visual Width**: The number of character cells a string occupies when rendered, excluding ANSI escape codes
- **Render Context**: The target environment where ANSI content will be displayed (terminal, telnet, web)
- **Line Wrapping**: When a terminal automatically moves to the next line after reaching the terminal width
- **ANSI Escape Code**: Control sequences like `\x1b[33m` that change text color/style

## Requirements

### Requirement 1: Centralized ANSI Rendering Service

**User Story:** As a BBS developer, I want a single, reliable service for all ANSI rendering, so that I don't have to worry about alignment issues in different parts of the codebase.

#### Acceptance Criteria

1. THE system SHALL provide a centralized ANSIRenderingService that all modules use for ANSI content generation
2. WHEN any module needs to render ANSI content THEN it SHALL call the ANSIRenderingService rather than constructing ANSI strings directly
3. THE ANSIRenderingService SHALL be the single source of truth for ANSI rendering logic
4. THE system SHALL prevent direct ANSI string construction outside the rendering service
5. THE ANSIRenderingService SHALL handle all visual width calculations internally

### Requirement 2: Context-Aware Rendering

**User Story:** As a BBS operator, I want ANSI frames to render correctly in all client types (raw terminal, telnet, web terminal), so that users have a consistent experience regardless of how they connect.

#### Acceptance Criteria

1. THE ANSIRenderingService SHALL support multiple render contexts (terminal, telnet, web)
2. WHEN rendering for terminal context THEN the system SHALL account for terminal width and prevent line wrapping
3. WHEN rendering for web context THEN the system SHALL generate HTML-safe output with proper color rendering
4. WHEN rendering for telnet context THEN the system SHALL use appropriate line endings (CRLF)
5. THE system SHALL allow callers to specify the target render context

### Requirement 3: Guaranteed Frame Alignment

**User Story:** As a BBS user, I want all frames and boxes to be perfectly aligned, so that the interface looks professional and is easy to read.

#### Acceptance Criteria

1. THE system SHALL guarantee that all lines in a frame have identical visual width
2. WHEN a frame is rendered THEN all box-drawing characters SHALL align perfectly
3. THE system SHALL prevent line wrapping by ensuring frames fit within the target width
4. WHEN ANSI color codes are added THEN they SHALL NOT affect visual alignment
5. THE system SHALL validate frame alignment before returning rendered content

### Requirement 4: Safe Width Calculation

**User Story:** As a developer, I want accurate visual width calculations that account for ANSI codes and Unicode characters, so that my content aligns correctly.

#### Acceptance Criteria

1. THE system SHALL correctly calculate visual width by stripping ANSI escape codes
2. WHEN calculating width THEN the system SHALL account for multi-byte Unicode characters
3. THE system SHALL account for box-drawing characters (which are single-width)
4. WHEN padding text THEN the system SHALL use visual width, not byte length
5. THE system SHALL provide a utility function for visual width calculation

### Requirement 5: Template-Based Rendering

**User Story:** As a BBS developer, I want to define ANSI screens as templates with variables, so that I can reuse layouts with different content.

#### Acceptance Criteria

1. THE system SHALL support template-based ANSI screen definitions
2. WHEN a template contains variables THEN the system SHALL substitute them while maintaining alignment
3. THE system SHALL validate that variable substitution doesn't break frame alignment
4. WHEN variable content changes length THEN the system SHALL adjust padding automatically
5. THE system SHALL support conditional content in templates

### Requirement 6: Automatic Line Ending Management

**User Story:** As a BBS operator, I want the system to handle line endings correctly for different client types, so that content displays properly regardless of the connection method.

#### Acceptance Criteria

1. THE system SHALL use appropriate line endings based on render context
2. WHEN rendering for terminal THEN the system SHALL use LF (`\n`)
3. WHEN rendering for telnet THEN the system SHALL use CRLF (`\r\n`)
4. WHEN rendering for web THEN the system SHALL use LF (`\n`)
5. THE system SHALL never mix line ending types in a single output

### Requirement 7: Color Management

**User Story:** As a BBS developer, I want a simple way to apply colors to text without worrying about ANSI codes, so that I can focus on content rather than escape sequences.

#### Acceptance Criteria

1. THE system SHALL provide a high-level color API (e.g., `color('text', 'yellow')`)
2. WHEN applying colors THEN the system SHALL automatically add reset codes
3. THE system SHALL support named colors (red, green, blue, yellow, cyan, magenta, white, gray)
4. WHEN rendering for web THEN the system SHALL convert ANSI colors to HTML/CSS
5. THE system SHALL prevent color code leakage between lines

### Requirement 8: Frame Builder Integration

**User Story:** As a developer, I want to build complex frames with titles, borders, and content sections, so that I can create professional-looking screens easily.

#### Acceptance Criteria

1. THE system SHALL provide a frame builder API for constructing bordered content
2. WHEN building a frame THEN the system SHALL guarantee alignment of all borders
3. THE system SHALL support different border styles (single, double, rounded)
4. WHEN adding content to a frame THEN the system SHALL handle padding automatically
5. THE system SHALL support nested frames and dividers

### Requirement 9: Validation and Testing

**User Story:** As a QA engineer, I want automated validation of ANSI rendering, so that I can catch alignment issues before they reach production.

#### Acceptance Criteria

1. THE system SHALL provide validation functions for rendered ANSI content
2. WHEN validation fails THEN the system SHALL provide detailed error messages
3. THE system SHALL include automated tests for all rendering scenarios
4. WHEN a frame is rendered THEN the system SHALL optionally validate it automatically
5. THE system SHALL support visual regression testing for ANSI output

### Requirement 10: Simple API

**User Story:** As a developer working on MVP, I want a simple, intuitive API for ANSI rendering, so that I can quickly fix rendering issues and move forward.

#### Acceptance Criteria

1. THE system SHALL provide a simple, easy-to-understand API
2. WHEN migrating existing code THEN the changes SHALL be minimal
3. THE system SHALL have clear documentation with examples
4. WHEN errors occur THEN the system SHALL provide helpful error messages
5. THE system SHALL be easy to test and debug
