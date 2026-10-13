'use client';

import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Giỏ hàng chưa làm (spec public-catalog §4.3): nút khoá nhưng vẫn focus được để đọc tooltip "Sắp có".
export function AddToCartButton() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="accent"
            size="lg"
            disabled
            focusableWhenDisabled
            className="w-full aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
          />
        }
      >
        <ShoppingCart data-icon="inline-start" aria-hidden />
        Thêm vào giỏ
      </TooltipTrigger>
      <TooltipContent>Sắp có</TooltipContent>
    </Tooltip>
  );
}
