# Manual Testing Procedures

## Overview

This document provides comprehensive manual testing procedures for the BaudAgain BBS system. It includes step-by-step checklists, expected behaviors, and visual examples for verifying system functionality without automated tools.

**Target Audience**: QA testers, developers, stakeholders
**Prerequisites**: Access to running BBS server and web browser
**Time Required**: 45-60 minutes for complete manual test

## Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Welcome Screen Testing](#welcome-screen-testing)
3. [Registration Testing](#registration-testing)
4. [Login Testing](#login-testing)
5. [Main Menu Navigation](#main-menu-navigation)
6. [Message Base Testing](#message-base-testing)
7. [Door Games Testing](#door-games-testing)
8. [AI Features Testing](#ai-features-testing)
9. [Visual Quality Checklist](#visual-quality-checklist)
10. [Bug Reporting](#bug-reporting)

## Test Environment Setup

### Prerequisites Checklist

- [ ] BBS server is running (`npm run dev` in server directory)
- [ ] Server accessible at http://localhost:8080
- [ ] Test user account exists (or ability to create new account)
- [ ] Browser with JavaScript enabled (Chrome, Firefox, Safari, Edge)
- [ ] Notepad or document for recording observations
- [ ] Screenshot tool ready (built-in or third-party)

### Starting the Server

```bash
cd server
npm run dev
```

**Expected Console Output**:
```
🚀 BaudAgain BBS Server starting...
📊 Database initialized
🌐 HTTP server listening on port 3001
🔌 WebSocket server ready
✅ Server ready at http://localhost:3001
```

### Opening the Terminal

1. Open web browser
2. Navigate to: `http://localhost:8080`
3. Wait for terminal to load (2-3 seconds)
4. Terminal should display welcome screen


## Welcome Screen Testing

### Test 1.1: Welcome Screen Display

**Requirement**: 1.1 - Welcome screen displays correctly

**Steps**:
1. Navigate to http://localhost:8080
2. Wait for page to load completely
3. Observe the welcome screen

**Expected Behavior**:
- ✅ Welcome screen appears within 3 seconds
- ✅ ANSI art/logo displays with colors
- ✅ BBS name is visible and prominent
- ✅ Box-drawing characters render correctly (not as question marks or boxes)
- ✅ Colors are vibrant and readable
- ✅ Text is properly aligned within frames

**Visual Checklist**:
- [ ] Top border of frame is complete and aligned
- [ ] Bottom border of frame is complete and aligned
- [ ] Left border is straight and consistent
- [ ] Right border is straight and consistent
- [ ] No broken or missing characters
- [ ] Colors display correctly (not all white or all one color)
- [ ] Text is readable and not overlapping

**Screenshot**: Take screenshot and save as `welcome_screen.png`

### Test 1.2: Single Prompt Verification

**Requirement**: 1.2 - Exactly one prompt appears

**Steps**:
1. On welcome screen, scroll to bottom
2. Count the number of "Enter your handle:" prompts

**Expected Behavior**:
- ✅ Exactly ONE prompt appears
- ✅ Prompt text is clear: "Enter your handle:" or similar
- ✅ Cursor is positioned after the prompt
- ✅ Prompt is at the bottom of the screen

**Bug Indicators**:
- ❌ Multiple prompts appear (duplicate prompt bug)
- ❌ No prompt appears
- ❌ Prompt appears in middle of screen

**Screenshot**: If multiple prompts appear, take screenshot showing the issue

### Test 1.3: Width Verification

**Requirement**: 1.3 - All lines within 80 characters

**Steps**:
1. Visually inspect all lines of text
2. Check if any lines extend beyond the right edge
3. Check if horizontal scrolling is needed

**Expected Behavior**:
- ✅ No lines extend beyond terminal width
- ✅ No horizontal scrollbar appears
- ✅ All content fits within visible area
- ✅ Frame borders align vertically

**Manual Width Check**:
- Count characters in longest visible line
- Should not exceed 80 characters
- Use ruler or character counter if needed

**Bug Indicators**:
- ❌ Lines wrap unexpectedly
- ❌ Text extends beyond right edge
- ❌ Horizontal scrollbar appears
- ❌ Frame borders don't align

### Test 1.4: Frame Alignment

**Requirement**: 1.4 - Frame borders properly aligned

**Steps**:
1. Examine top border of welcome frame
2. Examine bottom border of welcome frame
3. Examine left and right borders
4. Check corners are properly formed

**Expected Behavior**:
- ✅ Top border is straight horizontal line
- ✅ Bottom border is straight horizontal line
- ✅ Left border is straight vertical line
- ✅ Right border is straight vertical line
- ✅ All four corners are properly formed
- ✅ Borders use box-drawing characters (─ │ ┌ ┐ └ ┘)

**Visual Example**:
```
┌────────────────────────────────────────┐
│         Welcome to BaudAgain           │
│                                        │
│         Your Retro BBS Experience      │
└────────────────────────────────────────┘
```

**Bug Indicators**:
- ❌ Borders use ASCII characters (- | + instead of box-drawing)
- ❌ Borders are broken or incomplete
- ❌ Corners are missing or malformed
- ❌ Left and right borders don't align


## Registration Testing

### Test 2.1: NEW Command

**Requirement**: 2.1 - NEW command initiates registration

**Steps**:
1. At welcome prompt, type: `NEW`
2. Press Enter
3. Observe response

**Expected Behavior**:
- ✅ System responds within 1 second
- ✅ Registration flow begins
- ✅ Prompt for handle appears
- ✅ Instructions are clear

**Screenshot**: Take screenshot of registration prompt

### Test 2.2: Handle Entry

**Requirement**: 2.2, 2.3 - Handle validation works

**Steps**:
1. Enter a handle (e.g., "TestUser123")
2. Press Enter
3. Observe validation

**Expected Behavior**:
- ✅ Handle is accepted if valid (3-20 characters, alphanumeric)
- ✅ System prompts for password
- ✅ Clear feedback if handle invalid

**Test Cases**:
- [ ] Valid handle (8 characters): Should accept
- [ ] Short handle (2 characters): Should reject
- [ ] Long handle (25 characters): Should reject
- [ ] Special characters (@#$): Should reject or sanitize
- [ ] Duplicate handle: Should reject with clear message

### Test 2.3: Password Entry

**Requirement**: 2.3, 2.4 - Password entry and validation

**Steps**:
1. Enter password (e.g., "TestPass123!")
2. Press Enter
3. Observe password masking and validation

**Expected Behavior**:
- ✅ Password is masked (shows *** or hidden)
- ✅ Password requirements are clear
- ✅ System prompts for confirmation
- ✅ Confirmation must match original

**Test Cases**:
- [ ] Strong password: Should accept
- [ ] Weak password: Should reject with requirements
- [ ] Mismatched confirmation: Should reject and re-prompt
- [ ] Password visible: Should be masked/hidden

### Test 2.4: Profile Information

**Requirement**: 2.4 - Profile information collected

**Steps**:
1. Enter real name (optional)
2. Enter location (optional)
3. Complete registration

**Expected Behavior**:
- ✅ Optional fields can be skipped
- ✅ Clear indication of optional vs required
- ✅ Registration completes successfully

### Test 2.5: Registration Completion

**Requirement**: 2.5 - Account created and user logged in

**Steps**:
1. Complete all registration steps
2. Observe final confirmation

**Expected Behavior**:
- ✅ Success message displays
- ✅ User is automatically logged in
- ✅ Main menu displays
- ✅ Personalized greeting appears

**Screenshot**: Take screenshot of successful registration and main menu


## Login Testing

### Test 3.1: Existing User Login

**Requirement**: 3.1, 3.2 - Login flow works correctly

**Steps**:
1. At welcome prompt, enter existing handle
2. Press Enter
3. Enter password
4. Press Enter

**Expected Behavior**:
- ✅ System prompts for password after handle
- ✅ Password is masked
- ✅ Authentication succeeds with correct credentials
- ✅ Main menu displays after successful login

**Test Cases**:
- [ ] Correct credentials: Should login successfully
- [ ] Wrong password: Should reject and re-prompt
- [ ] Non-existent handle: Should reject with clear message
- [ ] Case sensitivity: Test if handles are case-sensitive

**Screenshot**: Take screenshot of successful login and main menu

### Test 3.2: Personalized Greeting

**Requirement**: 3.5 - Personalized greeting displays

**Steps**:
1. After successful login, observe greeting
2. Check for personalized elements

**Expected Behavior**:
- ✅ Greeting includes user's handle
- ✅ Last login date/time shown (if not first login)
- ✅ New message count shown (if any)
- ✅ Greeting is friendly and welcoming

**Example**:
```
Welcome back, TestUser!
Last login: December 3, 2025 at 10:30 AM
You have 3 new messages.
```

### Test 3.3: Failed Login Handling

**Requirement**: 3.4 - Failed login handled gracefully

**Steps**:
1. Enter valid handle
2. Enter incorrect password
3. Observe error handling

**Expected Behavior**:
- ✅ Clear error message displays
- ✅ User can retry without restarting
- ✅ No sensitive information revealed
- ✅ Rate limiting prevents brute force (after multiple attempts)

**Test Cases**:
- [ ] Wrong password once: Should allow retry
- [ ] Wrong password 3 times: Should show rate limit message
- [ ] Wrong password 5 times: Should temporarily block


## Main Menu Navigation

### Test 4.1: Main Menu Display

**Requirement**: 3.2, 3.3 - Main menu displays with all options

**Steps**:
1. After login, observe main menu
2. Check all menu options are present

**Expected Behavior**:
- ✅ Menu displays in clear frame
- ✅ All options are listed with commands
- ✅ Options are properly formatted
- ✅ Instructions are clear

**Menu Options Checklist**:
- [ ] (M) Messages / Message Bases
- [ ] (D) Door Games / Doors
- [ ] (U) User List / Who's Online
- [ ] (P) Page SysOp / Contact Admin
- [ ] (S) Settings / Profile
- [ ] (G) Goodbye / Logout
- [ ] (?) Help

**Screenshot**: Take screenshot of main menu

### Test 4.2: Navigate to Messages

**Requirement**: 3.3 - Navigation to Messages works

**Steps**:
1. From main menu, type: `M`
2. Press Enter
3. Observe message base list

**Expected Behavior**:
- ✅ Message base list displays
- ✅ Available message bases shown
- ✅ Clear instructions for selection
- ✅ Option to return to main menu

### Test 4.3: Navigate to Doors

**Requirement**: 3.3 - Navigation to Doors works

**Steps**:
1. From main menu, type: `D`
2. Press Enter
3. Observe door games list

**Expected Behavior**:
- ✅ Door games list displays
- ✅ Available doors shown with descriptions
- ✅ Clear instructions for selection
- ✅ Option to return to main menu

### Test 4.4: Return to Main Menu

**Requirement**: 3.5 - Return to main menu works

**Steps**:
1. Navigate to any submenu (Messages or Doors)
2. Type: `Q` or `X` (quit/exit command)
3. Press Enter

**Expected Behavior**:
- ✅ Returns to main menu
- ✅ Main menu displays correctly
- ✅ No errors or glitches
- ✅ Session state maintained

### Test 4.5: Invalid Command Handling

**Requirement**: 3.4 - Invalid commands handled gracefully

**Steps**:
1. From main menu, type invalid command: `Z`
2. Press Enter
3. Observe error handling

**Expected Behavior**:
- ✅ Clear error message displays
- ✅ Menu remains displayed
- ✅ User can try again
- ✅ No system crash or hang


## Message Base Testing

### Test 5.1: Message Base List

**Requirement**: 4.1, 4.2 - Message base list displays

**Steps**:
1. Navigate to Messages from main menu
2. Observe message base list

**Expected Behavior**:
- ✅ List of message bases displays
- ✅ Each base shows name and description
- ✅ Number of messages shown (if available)
- ✅ Clear selection instructions

**Screenshot**: Take screenshot of message base list

### Test 5.2: Enter Message Base

**Requirement**: 4.3 - Message base entry works

**Steps**:
1. Select a message base (e.g., type `1`)
2. Press Enter
3. Observe message list

**Expected Behavior**:
- ✅ Message list displays
- ✅ Messages shown with subject, author, date
- ✅ Clear formatting and alignment
- ✅ Options to read, post, or return

### Test 5.3: Message List Display

**Requirement**: 4.4, 4.5 - Message list shows correct information

**Steps**:
1. In message list, examine each message entry
2. Check all required information is present

**Expected Behavior**:
- ✅ Message number shown
- ✅ Subject displayed clearly
- ✅ **Author handle displayed (NOT "undefined")**
- ✅ Date/time displayed
- ✅ Read/unread indicator (if applicable)

**CRITICAL CHECK - Author Handle**:
- [ ] Check EVERY message for author handle
- [ ] **NO message should show "by undefined"**
- [ ] **NO message should show "by null"**
- [ ] **NO message should show "by " (empty)**
- [ ] If ANY message shows undefined/null, this is a BUG

**Example of Correct Display**:
```
1. Welcome to the BBS          by SysOp      Dec 1, 2025
2. Test Message                by TestUser   Dec 2, 2025
3. Hello Everyone              by NewUser    Dec 3, 2025
```

**Example of BUG**:
```
1. Welcome to the BBS          by undefined  Dec 1, 2025  ❌ BUG!
2. Test Message                by TestUser   Dec 2, 2025  ✅ OK
```

**Screenshot**: Take screenshot of message list, especially if "undefined" appears

### Test 5.4: Read Message

**Requirement**: 5.1, 5.2, 5.3 - Message reading displays full content

**Steps**:
1. From message list, select a message number
2. Press Enter
3. Observe full message display

**Expected Behavior**:
- ✅ Full message displays in frame
- ✅ Subject shown at top
- ✅ **Author handle shown (NOT "undefined")**
- ✅ Date/time shown
- ✅ Full message body displayed
- ✅ Text wrapped properly within frame
- ✅ All lines within 80 characters
- ✅ Navigation options shown (next, previous, return)

**Screenshot**: Take screenshot of message reading view

### Test 5.5: Post New Message

**Requirement**: 6.1, 6.2, 6.3 - Message posting works

**Steps**:
1. From message list, type: `P` (post)
2. Press Enter
3. Enter subject when prompted
4. Enter message body
5. Confirm post

**Expected Behavior**:
- ✅ Subject prompt appears
- ✅ Subject is accepted
- ✅ Body prompt appears
- ✅ Multi-line body entry works
- ✅ Confirmation prompt appears
- ✅ Message is posted successfully

**Test Cases**:
- [ ] Short subject: Should accept
- [ ] Long subject: Should accept or truncate gracefully
- [ ] Empty subject: Should reject or prompt
- [ ] Multi-line body: Should accept
- [ ] Empty body: Should reject or prompt

### Test 5.6: Verify Posted Message

**Requirement**: 6.4, 6.5 - Posted message saved correctly

**Steps**:
1. After posting, return to message list
2. Find your posted message
3. Read your posted message

**Expected Behavior**:
- ✅ Posted message appears in list
- ✅ **Author is YOUR handle (NOT "undefined")**
- ✅ Subject matches what you entered
- ✅ Body matches what you entered
- ✅ Date/time is current

**CRITICAL CHECK**:
- [ ] **Your posted message shows YOUR handle as author**
- [ ] **NOT "undefined", "null", or empty**
- [ ] If your message shows wrong author, this is a BUG

**Screenshot**: Take screenshot showing your posted message with correct author


## Door Games Testing

### Test 6.1: Door Games List

**Requirement**: 7.1 - Door games list displays

**Steps**:
1. Navigate to Doors from main menu
2. Observe door games list

**Expected Behavior**:
- ✅ List of available doors displays
- ✅ Each door shows name and description
- ✅ Clear selection instructions
- ✅ Option to return to main menu

**Screenshot**: Take screenshot of door games list

### Test 6.2: Launch Door Game

**Requirement**: 7.2 - Door game launches successfully

**Steps**:
1. Select a door game (e.g., type `1`)
2. Press Enter
3. Observe door game loading

**Expected Behavior**:
- ✅ Door game loads within 2-3 seconds
- ✅ Introduction screen displays
- ✅ ANSI art renders correctly
- ✅ Instructions are clear

**Screenshot**: Take screenshot of door game introduction

### Test 6.3: ANSI Rendering in Doors

**Requirement**: 7.3, 7.4, 7.5 - ANSI rendering correct in doors

**Steps**:
1. In door game, observe all ANSI art and frames
2. Check colors, borders, and formatting

**Expected Behavior**:
- ✅ **All lines within 80 characters**
- ✅ **Frame borders properly aligned**
- ✅ ANSI colors display correctly
- ✅ Box-drawing characters render properly
- ✅ No broken or missing characters
- ✅ No horizontal scrolling needed

**CRITICAL CHECKS**:
- [ ] **Check EVERY screen in door for width**
- [ ] **NO line should exceed 80 characters**
- [ ] **Frame borders should be straight and aligned**
- [ ] If ANY line is too wide, this is a BUG
- [ ] If borders are misaligned, this is a BUG

**Visual Inspection**:
- Look for text extending beyond right edge
- Look for broken frame borders
- Look for misaligned corners
- Look for wrapped text that shouldn't wrap

**Screenshot**: Take screenshot of door game, especially if width or alignment issues

### Test 6.4: Door Game Interaction

**Requirement**: 7.2 - Door game interaction works

**Steps**:
1. Follow door game prompts
2. Enter input as requested
3. Observe responses

**Expected Behavior**:
- ✅ Prompts are clear
- ✅ Input is accepted
- ✅ Responses display correctly
- ✅ Game logic works as expected
- ✅ No errors or crashes

**Test Cases** (for Art Studio door):
- [ ] Create new art: Should work
- [ ] View gallery: Should display art
- [ ] Exit: Should return to menu

**Test Cases** (for Oracle door):
- [ ] Ask question: Should get mystical response
- [ ] Response within 150 characters: Should be concise
- [ ] Mystical symbols present: Should have ✨🔮 etc.

### Test 6.5: Exit Door Game

**Requirement**: 7.5 - Exit returns to menu

**Steps**:
1. In door game, find exit command (usually Q or X)
2. Type exit command
3. Press Enter

**Expected Behavior**:
- ✅ Door game exits cleanly
- ✅ Returns to main menu or door list
- ✅ No errors or hanging
- ✅ Session state maintained


## AI Features Testing

### Test 7.1: Conversation Starters

**Requirement**: 8.1, 8.3 - Conversation starters display and work

**Steps**:
1. Navigate to Messages → Message Base
2. Look for conversation starters section
3. Try selecting a starter (if available)

**Expected Behavior**:
- ✅ Conversation starters section displays (if AI configured)
- ✅ 3-5 relevant topic suggestions shown
- ✅ Clear instructions for selection
- ✅ Selecting starter initiates new message with that topic

**Test Cases**:
- [ ] Starters display: Should show relevant topics
- [ ] Select starter: Should pre-fill subject
- [ ] No starters available: Should show helpful message
- [ ] AI service down: Should handle gracefully

**Note**: AI features require OpenAI API key configured. If not available, features may be disabled.

**Screenshot**: Take screenshot of conversation starters (if available)

### Test 7.2: Catch Me Up Summary

**Requirement**: 9.1, 9.2 - Catch me up summary works

**Steps**:
1. In message base, type: `C` or `CATCHUP`
2. Press Enter
3. Wait for summary (may take 5-30 seconds)

**Expected Behavior**:
- ✅ Command is recognized
- ✅ Loading indicator shows (optional)
- ✅ Summary generates within 30 seconds
- ✅ Summary displays key topics and highlights
- ✅ Summary formatted within frame boundaries
- ✅ All lines within 80 characters

**Test Cases**:
- [ ] With unread messages: Should generate summary
- [ ] No unread messages: Should show appropriate message
- [ ] AI timeout: Should show timeout message
- [ ] AI error: Should show error message

**Screenshot**: Take screenshot of catch me up summary

### Test 7.3: Daily Digest

**Requirement**: 10.1, 10.2, 10.3 - Daily digest on login

**Steps**:
1. Logout from BBS
2. Login again
3. Observe if daily digest notification appears

**Expected Behavior**:
- ✅ Digest notification appears (if digest available)
- ✅ Option to view digest is clear
- ✅ Digest content displays when selected
- ✅ Digest shows summaries of active discussions
- ✅ Digest formatted within frame boundaries
- ✅ All lines within 80 characters

**Test Cases**:
- [ ] Digest available: Should show notification
- [ ] No digest: Should proceed to menu normally
- [ ] View digest: Should display content
- [ ] Skip digest: Should go to main menu

**Screenshot**: Take screenshot of daily digest (if available)

### Test 7.4: AI Error Handling

**Requirement**: 8.4, 9.5 - AI errors handled gracefully

**Steps**:
1. Try AI features when service might be unavailable
2. Observe error messages

**Expected Behavior**:
- ✅ Clear error messages
- ✅ No system crashes
- ✅ User can continue using BBS
- ✅ Helpful suggestions provided

**Test Cases**:
- [ ] AI service down: Should show friendly error
- [ ] Rate limit exceeded: Should explain and suggest retry
- [ ] Timeout: Should show timeout message
- [ ] Invalid response: Should handle gracefully


## Visual Quality Checklist

### ANSI Rendering Quality

**Requirement**: 1.4, 7.4, 12.1-12.5

Use this checklist for EVERY screen you test:

#### Colors
- [ ] Colors display correctly (not all white or monochrome)
- [ ] Color combinations are readable
- [ ] Foreground and background colors have good contrast
- [ ] No color bleeding or artifacts

#### Box-Drawing Characters
- [ ] Box-drawing characters render as lines (not question marks)
- [ ] Corners are properly formed (┌ ┐ └ ┘)
- [ ] Horizontal lines are straight (─)
- [ ] Vertical lines are straight (│)
- [ ] No broken or missing border segments

#### Frame Alignment
- [ ] Top border is complete and straight
- [ ] Bottom border is complete and straight
- [ ] Left border is straight and consistent
- [ ] Right border is straight and consistent
- [ ] All four corners are present and correct
- [ ] Frame width is consistent throughout

#### Width Enforcement
- [ ] No lines extend beyond right edge
- [ ] No horizontal scrollbar appears
- [ ] All content fits within visible area
- [ ] Text wrapping is intentional and clean
- [ ] No awkward line breaks

#### Text Formatting
- [ ] Text is readable and clear
- [ ] Proper spacing between elements
- [ ] Alignment is consistent
- [ ] No overlapping text
- [ ] No cut-off text

### Performance Checklist

- [ ] Pages load within 3 seconds
- [ ] Commands respond within 1 second
- [ ] AI responses within 30 seconds
- [ ] No noticeable lag or freezing
- [ ] Smooth scrolling (if applicable)
- [ ] No memory leaks (browser doesn't slow down over time)

### Usability Checklist

- [ ] Instructions are clear and helpful
- [ ] Error messages are informative
- [ ] Navigation is intuitive
- [ ] Commands are easy to remember
- [ ] Prompts are unambiguous
- [ ] Feedback is immediate
- [ ] System feels responsive

### Accessibility Checklist

- [ ] Text is readable at normal size
- [ ] Color contrast is sufficient
- [ ] Important information not conveyed by color alone
- [ ] Keyboard navigation works
- [ ] No flashing or strobing effects


## Bug Reporting

### How to Report Bugs

When you find a bug, document it thoroughly:

#### Bug Report Template

```
BUG REPORT

Title: [Short description]

Requirement Violated: [e.g., 4.5 - Author handle display]

Severity: [Critical / High / Medium / Low]

Steps to Reproduce:
1. [First step]
2. [Second step]
3. [Third step]

Expected Behavior:
[What should happen]

Actual Behavior:
[What actually happened]

Screenshots:
[Attach screenshots showing the issue]

Environment:
- Browser: [Chrome 120, Firefox 121, etc.]
- OS: [Windows 11, macOS 14, etc.]
- Server Version: [Git commit or version]
- Date/Time: [When bug occurred]

Additional Notes:
[Any other relevant information]
```

### Bug Severity Guidelines

**Critical** (Must fix immediately):
- System crashes or hangs
- Data loss or corruption
- Security vulnerabilities
- Complete feature failure

**High** (Fix before release):
- Author shows as "undefined"
- Lines exceed 80 characters
- Frame borders misaligned
- Major functionality broken

**Medium** (Fix soon):
- Minor visual glitches
- Confusing error messages
- Performance issues
- Usability problems

**Low** (Fix when possible):
- Cosmetic issues
- Minor text errors
- Enhancement requests
- Nice-to-have features

### Common Bugs to Watch For

#### 1. Author "undefined" Bug
**Symptom**: Messages show "by undefined" instead of author handle
**Requirement**: 4.5, 5.5, 6.4
**Severity**: HIGH
**Screenshot**: Required

#### 2. Width Violation Bug
**Symptom**: Lines exceed 80 characters
**Requirement**: 1.3, 7.3, 12.1
**Severity**: HIGH
**Screenshot**: Required
**Note**: Document which lines and their actual width

#### 3. Frame Misalignment Bug
**Symptom**: Frame borders don't align properly
**Requirement**: 1.4, 7.5, 12.3
**Severity**: HIGH
**Screenshot**: Required

#### 4. Multiple Prompts Bug
**Symptom**: More than one prompt appears on welcome screen
**Requirement**: 1.2
**Severity**: HIGH
**Screenshot**: Required

#### 5. ANSI Rendering Bug
**Symptom**: Box-drawing characters show as question marks or boxes
**Requirement**: 1.4, 7.4
**Severity**: MEDIUM
**Screenshot**: Required
**Note**: May be browser or font issue

### Screenshot Guidelines

**When to Take Screenshots**:
- Every major screen (welcome, menu, messages, doors)
- Every bug or issue found
- Before and after actions
- Successful completions

**How to Take Good Screenshots**:
- Capture entire terminal window
- Include browser chrome if relevant
- Use descriptive filenames
- Save in PNG format
- Annotate if needed (arrows, highlights)

**Screenshot Naming**:
```
[test_area]_[description]_[timestamp].png

Examples:
welcome_screen_2025-12-04.png
message_list_undefined_author_bug.png
door_game_width_violation.png
registration_success.png
```

### Test Results Summary

After completing all tests, create a summary:

```
MANUAL TEST RESULTS SUMMARY

Date: [Test date]
Tester: [Your name]
Duration: [Time spent]

Tests Completed:
- Welcome Screen: [Pass/Fail]
- Registration: [Pass/Fail]
- Login: [Pass/Fail]
- Main Menu: [Pass/Fail]
- Messages: [Pass/Fail]
- Door Games: [Pass/Fail]
- AI Features: [Pass/Fail]

Critical Issues Found: [Number]
High Priority Issues: [Number]
Medium Priority Issues: [Number]
Low Priority Issues: [Number]

Overall Assessment: [Ready for release / Needs fixes / Major issues]

Detailed Findings:
[List each bug with reference to bug report]

Recommendations:
[What should be fixed before release]
```


## Quick Reference

### Test Execution Checklist

Use this checklist to track your progress:

- [ ] **Setup**
  - [ ] Server running
  - [ ] Browser open to http://localhost:8080
  - [ ] Screenshot tool ready
  - [ ] Notepad for observations

- [ ] **Welcome Screen** (15 min)
  - [ ] Welcome displays correctly
  - [ ] Single prompt only
  - [ ] Width within 80 characters
  - [ ] Frame borders aligned
  - [ ] Screenshots taken

- [ ] **Registration** (10 min)
  - [ ] NEW command works
  - [ ] Handle validation works
  - [ ] Password entry works
  - [ ] Registration completes
  - [ ] Screenshots taken

- [ ] **Login** (5 min)
  - [ ] Login with existing user works
  - [ ] Personalized greeting shows
  - [ ] Failed login handled
  - [ ] Screenshots taken

- [ ] **Main Menu** (5 min)
  - [ ] Menu displays correctly
  - [ ] Navigate to Messages works
  - [ ] Navigate to Doors works
  - [ ] Return to menu works
  - [ ] Screenshots taken

- [ ] **Messages** (15 min)
  - [ ] Message base list displays
  - [ ] Message list displays
  - [ ] **Author handles correct (NOT "undefined")**
  - [ ] Read message works
  - [ ] Post message works
  - [ ] **Posted message has correct author**
  - [ ] Screenshots taken

- [ ] **Door Games** (10 min)
  - [ ] Door list displays
  - [ ] Door launches
  - [ ] **Width within 80 characters**
  - [ ] **Frame borders aligned**
  - [ ] ANSI colors correct
  - [ ] Exit works
  - [ ] Screenshots taken

- [ ] **AI Features** (10 min)
  - [ ] Conversation starters (if available)
  - [ ] Catch me up (if available)
  - [ ] Daily digest (if available)
  - [ ] Error handling
  - [ ] Screenshots taken

- [ ] **Visual Quality** (5 min)
  - [ ] All screens checked for quality
  - [ ] ANSI rendering verified
  - [ ] Width enforcement verified
  - [ ] Frame alignment verified

- [ ] **Documentation** (10 min)
  - [ ] Bugs documented
  - [ ] Screenshots organized
  - [ ] Test summary created
  - [ ] Results reported

**Total Time**: ~90 minutes

### Critical Requirements Quick Check

Before completing testing, verify these critical requirements:

✅ **Width Enforcement** (Requirements 1.3, 7.3, 12.1)
- [ ] ALL screens checked for 80-character width
- [ ] NO lines exceed 80 characters
- [ ] NO horizontal scrolling needed

✅ **Frame Alignment** (Requirements 1.4, 7.5, 12.3)
- [ ] ALL frames have aligned borders
- [ ] Top, bottom, left, right borders present
- [ ] Corners properly formed

✅ **Author Handles** (Requirements 4.5, 5.5, 6.4)
- [ ] ALL messages show author handles
- [ ] NO "undefined" authors
- [ ] NO "null" authors
- [ ] NO empty authors

✅ **Single Prompt** (Requirement 1.2)
- [ ] Welcome screen has exactly ONE prompt
- [ ] NO duplicate prompts

### Common Commands Reference

**Main Menu**:
- `M` - Messages
- `D` - Doors
- `U` - Users
- `P` - Page SysOp
- `S` - Settings
- `G` - Goodbye (logout)
- `?` - Help

**Message Base**:
- `[number]` - Select message base
- `P` - Post new message
- `C` - Catch me up (summary)
- `Q` - Return to main menu

**Message List**:
- `[number]` - Read message
- `P` - Post new message
- `N` - Next page
- `Q` - Return to message base list

**Door Games**:
- `[number]` - Select door
- `Q` or `X` - Exit door (varies by door)

### Test Data Reference

**Test User** (if using setup script):
- Handle: `JourneyVet`
- Password: `VetPass456!`

**Or create your own**:
- Handle: Any valid handle (3-20 characters)
- Password: Any valid password (8+ characters)

### Resources

- **Requirements**: `.kiro/specs/user-journey-testing-and-fixes/requirements.md`
- **Design**: `.kiro/specs/user-journey-testing-and-fixes/design.md`
- **MCP Test Guide**: `server/src/testing/MCP_TEST_EXECUTION_GUIDE.md`
- **Test Suite Overview**: `server/src/testing/USER_JOURNEY_TEST_SUITE.md`

## Conclusion

This manual testing procedure provides comprehensive coverage of all critical user journeys in the BaudAgain BBS system. Follow the steps systematically, document all findings, and report bugs with clear descriptions and screenshots.

**Key Points to Remember**:
1. Test every screen for 80-character width
2. Check every message for author handles (NOT "undefined")
3. Verify frame borders are aligned on all screens
4. Take screenshots of everything, especially bugs
5. Document thoroughly for developers

**Happy Testing!** 🧪

