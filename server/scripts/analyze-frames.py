#!/usr/bin/env python3
"""Analyze ANSI frame alignment issues"""

import re
import sys

def strip_ansi(text):
    """Remove ANSI escape codes"""
    return re.sub(r'\x1b\[[0-9;]*m', '', text)

def analyze_frame(filename):
    """Analyze frame alignment in a file"""
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print(f"\n=== Analyzing {filename} ===\n")
    
    for i, line in enumerate(lines, 1):
        # Remove newline
        line = line.rstrip('\n\r')
        
        # Get raw length
        raw_len = len(line)
        
        # Strip ANSI codes
        stripped = strip_ansi(line)
        visual_len = len(stripped)
        
        # Count ANSI codes
        ansi_codes = len(re.findall(r'\x1b\[[0-9;]*m', line))
        
        print(f"Line {i:2d}: raw={raw_len:3d}, visual={visual_len:3d}, ansi={ansi_codes:2d} | {stripped[:60]}")
    
    # Check for consistent width
    visual_widths = []
    for line in lines:
        line = line.rstrip('\n\r')
        stripped = strip_ansi(line)
        if stripped:  # Skip empty lines
            visual_widths.append(len(stripped))
    
    if visual_widths:
        min_width = min(visual_widths)
        max_width = max(visual_widths)
        print(f"\nWidth range: {min_width} - {max_width} characters")
        if min_width != max_width:
            print(f"⚠️  INCONSISTENT WIDTH: {max_width - min_width} character difference")
        else:
            print("✓ Consistent width")

if __name__ == '__main__':
    files = sys.argv[1:] if len(sys.argv) > 1 else ['data/ansi/welcome.ans', 'data/ansi/goodbye.ans']
    for filename in files:
        try:
            analyze_frame(filename)
        except Exception as e:
            print(f"Error analyzing {filename}: {e}")
