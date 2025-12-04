# Door Games Bug Fix Test

## Bug Description
The door games feature was throwing "An unexpected error occurred" when accessed through the terminal client.

## Root Cause
The terminal client was not setting the correct app state when displaying the door games menu. After calling `showDoors()`, the app remained in `IN_MENU` state, so when the user entered a number to select a door, the code treated it as an invalid main menu command.

## Fix Applied
1. Added new `IN_DOOR_SELECTION` state to `AppState` enum
2. Updated `showDoors()` to set state to `IN_DOOR_SELECTION` after displaying doors
3. Added explicit handling for `IN_DOOR_SELECTION` state in `handleCommand()` function

## Test Plan
1. Login as TestVeteran
2. Select 'D' for Door Games from main menu
3. Verify door games list displays
4. Select '1' to enter The Oracle
5. Verify Oracle introduction displays
6. Test question/answer interaction
7. Exit door game

## Files Modified
- `client/terminal/src/state.ts` - Added `IN_DOOR_SELECTION` state
- `client/terminal/src/main.ts` - Updated `showDoors()` and `handleCommand()`
