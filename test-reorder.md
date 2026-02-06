# Reorder Logic Test Cases

## Scenario 1: Drag item 3 to after item 4 (between 4 and 5)

**Initial Array:** [0, 1, 2, **3**, 4, 5]
**Want:** [0, 1, 2, 4, **3**, 5]

**Current Logic:**
- sourceIndex = 3
- targetIndex = 4 (the layer they hover over)
- position = 'after' (mouse in bottom half)
- finalTargetIndex = targetIndex + 1 = 5
- Since sourceIndex (3) < finalTargetIndex (5):
  - newIndex = finalTargetIndex - 1 = 4
- Call moveArrayItem(path, 3, 4)

**What moveArrayItem does:**
1. Remove from index 3: [0, 1, 2, 4, 5]
2. Insert at index 4: [0, 1, 2, 4, **3**, 5] ✓

**This should work!**

## Scenario 2: Drag item 3 to after item 5 (end of list)

**Initial Array:** [0, 1, 2, **3**, 4, 5]
**Want:** [0, 1, 2, 4, 5, **3**]

**Current Logic:**
- sourceIndex = 3
- targetIndex = 5 (the layer they hover over)
- position = 'after' (mouse in bottom half)
- finalTargetIndex = targetIndex + 1 = 6
- Since sourceIndex (3) < finalTargetIndex (6):
  - newIndex = finalTargetIndex - 1 = 5
- Call moveArrayItem(path, 3, 5)

**What moveArrayItem does:**
1. Remove from index 3: [0, 1, 2, 4, 5]
2. Insert at index 5: [0, 1, 2, 4, 5, **3**] ✓

**This should also work!**

## Hypothesis

The logic looks correct. The issue might be:
1. The position detection in LayerItem (mouse position not correctly determining 'before' vs 'after')
2. The moveArrayItem implementation in the store
3. Something with the dropPosition state not being set correctly

Let me add console logging to debug...
