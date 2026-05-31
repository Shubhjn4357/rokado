"use client";

import { useEffect } from "react";

export function useSpatialNavigation() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // We only care about Arrow keys and Enter
      const isArrow = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key);
      const isEnter = e.key === "Enter";
      
      if (!isArrow && !isEnter) return;

      const active = document.activeElement;
      if (!active) return;

      const tagName = active.tagName.toLowerCase();
      
      // If it's a textarea, bypass to allow standard multiline editing
      if (tagName === "textarea") {
        return;
      }

      // If it's a text input and has an active autocomplete open, let the autocomplete handle Up/Down/Enter
      if (tagName === "input") {
        const input = active as HTMLInputElement;
        
        // Detect open dropdowns (autocompletes, select boxes, etc.)
        const hasOpenDropdown = 
          input.getAttribute("aria-expanded") === "true" ||
          document.querySelector(".absolute.z-\\[200\\]") !== null || // Our custom Autocomplete popover
          document.querySelector("[role='listbox']") !== null || // Radix Select list
          document.querySelector("[data-radix-menu-content]") !== null; // Radix Dropdown list

        if (hasOpenDropdown && (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Enter")) {
          return;
        }

        // For Left/Right arrows inside text inputs, only navigate out if text cursor is at boundaries
        if (e.key === "ArrowLeft") {
          const start = input.selectionStart;
          if (start !== null && start > 0) {
            return; // let user move cursor left inside text
          }
        }
        if (e.key === "ArrowRight") {
          const end = input.selectionEnd;
          const valLen = input.value.length;
          if (end !== null && end < valLen) {
            return; // let user move cursor right inside text
          }
        }
      }

      // If it's a select element, native select box handles Arrow Up/Down
      if (tagName === "select") {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          return;
        }
      }

      // Let buttons, links, or submit buttons click natively on Enter
      if (isEnter) {
        if (tagName === "button" || tagName === "a") {
          // If it's a standard button/link, let Enter activate it
          if (active.getAttribute("type") === "submit") {
            return; // Let standard form submission handle it
          }
          const isAutocompleteBtn = active.closest(".absolute.z-\\[200\\]") !== null;
          if (!isAutocompleteBtn) {
            return;
          }
        } else if (active.getAttribute("tabindex") === "0") {
          // Trigger click for custom focusable elements (like table rows or cards) on Enter
          (active as HTMLElement).click();
          e.preventDefault();
          return;
        }
      }

      // Intercept keypress
      e.preventDefault();

      // Determine context container (normally document, but if dialog/popover/autocomplete open, restrict it)
      let container: ParentNode = document;
      const openDialog = document.querySelector('[role="dialog"]');
      const openPopover = document.querySelector('[data-radix-menu-content], [role="listbox"], .absolute.z-\\[200\\]');
      
      if (openDialog) {
        container = openDialog;
      } else if (openPopover) {
        container = openPopover;
      }

      // Find all visible, focusable elements inside the active container
      const focusableSelector = 'input, select, textarea, button, a[href], [tabindex="0"]';
      const allElements = Array.from(container.querySelectorAll(focusableSelector)) as HTMLElement[];
      
      const visibleFocusable = allElements.filter((el) => {
        if (el === active) return false;
        if (el.getAttribute("tabindex") === "-1") return false;
        if ((el as any).disabled) return false;
        
        // Geometry check
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        
        // CSS check
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
          return false;
        }
        
        return true;
      });

      // If active element is the body (focus lost), focus the first visible focusable element!
      if (active === document.body) {
        if (visibleFocusable.length > 0) {
          const firstEl = visibleFocusable[0];
          firstEl.focus();
          if (firstEl.tagName.toLowerCase() === "input") {
            const input = firstEl as HTMLInputElement;
            if (["text", "number", "tel", "password"].includes(input.type)) {
              input.select();
            }
          }
          e.preventDefault();
        }
        return;
      }

      if (visibleFocusable.length === 0) return;

      const activeRect = active.getBoundingClientRect();
      const activeCenter = {
        x: activeRect.left + activeRect.width / 2,
        y: activeRect.top + activeRect.height / 2,
      };

      // Enter behaves like Tab -> Moves focus to the next visible focusable in DOM order
      if (isEnter) {
        const currentIndex = allElements.indexOf(active as HTMLElement);
        if (currentIndex !== -1) {
          for (let i = 1; i < allElements.length; i++) {
            const nextEl = allElements[(currentIndex + i) % allElements.length];
            if (visibleFocusable.includes(nextEl)) {
              nextEl.focus();
              if (nextEl.tagName.toLowerCase() === "input") {
                const input = nextEl as HTMLInputElement;
                if (["text", "number", "tel", "password"].includes(input.type)) {
                  input.select();
                }
              }
              return;
            }
          }
        }
        return;
      }

      // Arrow navigation
      let bestElement: HTMLElement | null = null;
      let minDistance = Infinity;

      visibleFocusable.forEach((el) => {
        const elRect = el.getBoundingClientRect();
        const elCenter = {
          x: elRect.left + elRect.width / 2,
          y: elRect.top + elRect.height / 2,
        };

        const dx = elCenter.x - activeCenter.x;
        const dy = elCenter.y - activeCenter.y;

        let isCorrectDirection = false;
        let distance = Infinity;

        switch (e.key) {
          case "ArrowDown":
            isCorrectDirection = dy > 2; // Must be strictly below
            // Heavily penalize horizontal drift so ArrowDown favors staying in same column
            distance = dy * dy + dx * dx * 10;
            break;
          case "ArrowUp":
            isCorrectDirection = dy < -2; // Must be strictly above
            distance = dy * dy + dx * dx * 10;
            break;
          case "ArrowRight":
            isCorrectDirection = dx > 2; // Must be to the right
            // Heavily penalize vertical drift so ArrowRight favors staying in same horizontal row
            distance = dx * dx + dy * dy * 10;
            break;
          case "ArrowLeft":
            isCorrectDirection = dx < -2; // Must be to the left
            distance = dx * dx + dy * dy * 10;
            break;
        }

        if (isCorrectDirection && distance < minDistance) {
          minDistance = distance;
          bestElement = el;
        }
      });

      if (bestElement) {
        const targetElement = bestElement as HTMLElement;
        targetElement.focus();
        
        // Standard Tally behavior: auto-select text inside newly focused input fields
        if (targetElement.tagName.toLowerCase() === "input") {
          const input = targetElement as HTMLInputElement;
          if (["text", "number", "tel", "password"].includes(input.type)) {
            input.select();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, []);
}
