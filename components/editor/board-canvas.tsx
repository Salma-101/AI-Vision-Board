'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group, Transformer, Line, Circle } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import { BoardElement, CATEGORY_COLORS } from '@/lib/types';
import { useEditorStore } from '@/lib/editor-store';

interface CanvasImageProps {
  element: BoardElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<BoardElement>) => void;
  onCommit: () => void;
}

function CanvasImage({ element, isSelected, onSelect, onChange, onCommit }: CanvasImageProps) {
  const [img] = useImage(element.properties.src || '', 'anonymous');
  const shapeRef = useRef<Konva.Image>(null);
  const tapeColor = element.properties.tapeColor || 'rgba(200,200,200,0.35)';

  return (
    <Group
      ref={shapeRef as unknown as React.RefObject<Konva.Group>}
      id={element.id}
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      opacity={element.properties.opacity ?? 1}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onChange({ x: e.target.x(), y: e.target.y() });
        onCommit();
      }}
      onTransformEnd={() => {
        const node = shapeRef.current;
        if (!node) return;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(50, node.width() * scaleX),
          height: Math.max(50, node.height() * scaleY),
          rotation: node.rotation(),
        });
        node.scaleX(1);
        node.scaleY(1);
        onCommit();
      }}
    >
      {/* Paper backing shadow */}
      <Rect
        x={-4}
        y={-4}
        width={element.width + 8}
        height={element.height + 8}
        cornerRadius={2}
        fill="rgba(255,255,252,0.95)"
        shadowColor="black"
        shadowBlur={24}
        shadowOpacity={0.18}
        shadowOffsetY={8}
      />
      {/* Image */}
      <KonvaImage
        image={img}
        x={0}
        y={0}
        width={element.width}
        height={element.height}
        cornerRadius={element.properties.cornerRadius ?? 2}
      />
      {/* Tape strips at corners */}
      <Group x={element.width * 0.15} y={-12} rotation={-8}>
        <Rect width={50} height={20} cornerRadius={1} fill={tapeColor} />
      </Group>
      <Group x={element.width * 0.6} y={-10} rotation={5}>
        <Rect width={45} height={18} cornerRadius={1} fill={tapeColor} opacity={0.7} />
      </Group>
    </Group>
  );
}

interface CanvasTextProps {
  element: BoardElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<BoardElement>) => void;
  onCommit: () => void;
}

function CanvasText({ element, isSelected, onSelect, onChange, onCommit }: CanvasTextProps) {
  const shapeRef = useRef<Konva.Text>(null);

  return (
    <Text
      ref={shapeRef}
      id={element.id}
      text={element.properties.text || ''}
      x={element.x}
      y={element.y}
      width={element.width}
      fontSize={element.properties.fontSize ?? 24}
      fontFamily={element.properties.fontFamily ?? 'Inter, sans-serif'}
      fontStyle={element.properties.fontStyle ?? 'normal'}
      fill={element.properties.fill ?? '#1a1a1a'}
      rotation={element.rotation}
      opacity={element.properties.opacity ?? 1}
      align="center"
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onChange({ x: e.target.x(), y: e.target.y() });
        onCommit();
      }}
      onTransformEnd={() => {
        const node = shapeRef.current;
        if (!node) return;
        const scaleX = node.scaleX();
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(50, node.width() * scaleX),
          rotation: node.rotation(),
          properties: {
            ...element.properties,
            fontSize: Math.max(8, (element.properties.fontSize ?? 24) * scaleX),
          },
        });
        node.scaleX(1);
        node.scaleY(1);
        onCommit();
      }}
    />
  );
}

interface CanvasGoalCardProps {
  element: BoardElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<BoardElement>) => void;
  onCommit: () => void;
  onOpenGoal?: (goalId: string) => void;
}

function CanvasGoalCard({ element, isSelected, onSelect, onChange, onCommit, onOpenGoal }: CanvasGoalCardProps) {
  const shapeRef = useRef<Konva.Group>(null);
  const bgColor = element.properties.backgroundColor ?? '#ffffff';
  const borderColor = element.properties.borderColor ?? CATEGORY_COLORS[element.properties.goalCategory ?? 'other'];
  const padding = element.properties.padding ?? 16;
  const innerWidth = element.width - padding * 2;
  const titleText = element.properties.goalTitle ?? 'Goal';
  const descriptionText = element.properties.goalDescription ?? '';
  const categoryText = (element.properties.goalCategory ?? 'other').charAt(0).toUpperCase() + (element.properties.goalCategory ?? 'other').slice(1);
  const stepCompleted = element.properties.goalStepCompleted ?? 0;
  const stepTotal = element.properties.goalStepTotal ?? 0;
  const hasProgress = stepTotal > 0;
  const progressRatio = hasProgress ? stepCompleted / stepTotal : 0;
  const progressText = hasProgress ? `${stepCompleted}/${stepTotal} steps` : '';
  const cardHeight = element.height;
  const tapeColor = 'rgba(210,200,180,0.35)';

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.detail === 2 && onOpenGoal && element.properties.goalId) {
      onOpenGoal(element.properties.goalId);
      return;
    }
    onSelect();
  };

  return (
    <Group
      ref={shapeRef}
      id={element.id}
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      opacity={element.properties.opacity ?? 1}
      draggable
      onClick={handleClick}
      onTap={onSelect}
      onDragEnd={(e) => {
        onChange({ x: e.target.x(), y: e.target.y() });
        onCommit();
      }}
      onTransformEnd={() => {
        const node = shapeRef.current;
        if (!node) return;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(100, node.width() * scaleX),
          height: Math.max(100, node.height() * scaleY),
          rotation: node.rotation(),
        });
        node.scaleX(1);
        node.scaleY(1);
        onCommit();
      }}
    >
      {/* Paper card with slight irregular shadow */}
      <Rect
        x={-3}
        y={-3}
        width={element.width + 6}
        height={element.height + 6}
        cornerRadius={4}
        fill="rgba(255,253,250,0.9)"
        shadowColor="black"
        shadowBlur={20}
        shadowOpacity={0.12}
        shadowOffsetY={6}
        shadowOffsetX={2}
      />
      {/* Main card body */}
      <Rect
        width={element.width}
        height={element.height}
        cornerRadius={4}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={1.5}
      />
      {/* Category accent bar at top */}
      <Rect
        x={0}
        y={0}
        width={element.width}
        height={5}
        cornerRadius={[4, 4, 0, 0]}
        fill={borderColor}
      />
      {/* Tape at top corners */}
      <Group x={-8} y={-14} rotation={-12}>
        <Rect width={40} height={18} cornerRadius={1} fill={tapeColor} />
      </Group>
      <Group x={element.width - 28} y={-12} rotation={8}>
        <Rect width={36} height={16} cornerRadius={1} fill={tapeColor} opacity={0.7} />
      </Group>

      {/* Category label */}
      <Text
        x={padding}
        y={padding + 2}
        width={innerWidth}
        text={categoryText}
        fontSize={10}
        fontFamily="Inter, sans-serif"
        fill={borderColor}
        fontStyle="600"
        letterSpacing={1}
      />
      {/* Goal title */}
      <Text
        x={padding}
        y={padding + 20}
        width={innerWidth}
        text={titleText}
        fontSize={15}
        fontFamily="Inter, sans-serif"
        fontStyle="700"
        fill="#1a1a1a"
        wrap="word"
      />
      {/* Description */}
      {descriptionText && (
        <Text
          x={padding}
          y={padding + 20 + Math.min(40, Math.ceil(titleText.length / 28) * 20)}
          width={innerWidth}
          text={descriptionText}
          fontSize={11}
          fontFamily="Inter, sans-serif"
          fill="#666666"
          wrap="word"
          maxHeight={50}
        />
      )}

      {/* Progress section at bottom */}
      {hasProgress && (
        <Group y={cardHeight - 38}>
          <Rect
            x={padding}
            y={0}
            width={innerWidth}
            height={1}
            fill="rgba(0,0,0,0.06)"
          />
          <Text
            x={padding}
            y={8}
            text={progressText}
            fontSize={10}
            fontFamily="Inter, sans-serif"
            fill="#888888"
          />
          {/* Progress bar background */}
          <Rect
            x={padding}
            y={24}
            width={innerWidth}
            height={5}
            cornerRadius={2.5}
            fill="rgba(0,0,0,0.06)"
          />
          {/* Progress bar fill */}
          <Rect
            x={padding}
            y={24}
            width={Math.max(0, innerWidth * progressRatio)}
            height={5}
            cornerRadius={2.5}
            fill={borderColor}
          />
        </Group>
      )}

      {/* Pin at top center */}
      <Circle
        x={element.width / 2}
        y={-4}
        radius={5}
        fill={borderColor}
        shadowColor="black"
        shadowBlur={4}
        shadowOpacity={0.2}
        shadowOffsetY={2}
      />
    </Group>
  );
}

interface CanvasStickerProps {
  element: BoardElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<BoardElement>) => void;
  onCommit: () => void;
}

function CanvasSticker({ element, isSelected, onSelect, onChange, onCommit }: CanvasStickerProps) {
  const [img] = useImage(element.properties.src || '', 'anonymous');
  const shapeRef = useRef<Konva.Image>(null);

  return (
    <KonvaImage
      ref={shapeRef}
      id={element.id}
      image={img}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      opacity={element.properties.opacity ?? 1}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onChange({ x: e.target.x(), y: e.target.y() });
        onCommit();
      }}
      onTransformEnd={() => {
        const node = shapeRef.current;
        if (!node) return;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(30, node.width() * scaleX),
          height: Math.max(30, node.height() * scaleY),
          rotation: node.rotation(),
        });
        node.scaleX(1);
        node.scaleY(1);
        onCommit();
      }}
    />
  );
}

interface BoardCanvasProps {
  width: number;
  height: number;
  onOpenGoal?: (goalId: string) => void;
}

export default function BoardCanvas({ width, height, onOpenGoal }: BoardCanvasProps) {
  const {
    elements,
    selectedIds,
    zoom,
    panX,
    panY,
    backgroundColor,
    selectElement,
    updateElement,
    commitHistory,
    setZoom,
    setPan,
  } = useEditorStore();

  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
      if (e.evt.ctrlKey || e.evt.metaKey) {
        e.evt.preventDefault();
        const scaleBy = 1.05;
        const oldScale = zoom;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const mousePointTo = {
          x: (pointer.x - panX) / oldScale,
          y: (pointer.y - panY) / oldScale,
        };

        const direction = e.evt.deltaY > 0 ? -1 : 1;
        const newScale = Math.max(0.1, Math.min(3, direction > 0 ? oldScale * scaleBy : oldScale / scaleBy));

        setZoom(newScale);
        setPan(
          pointer.x - mousePointTo.x * newScale,
          pointer.y - mousePointTo.y * newScale
        );
      } else {
        setPan(panX - e.evt.deltaX, panY - e.evt.deltaY);
      }
    };

    stage.on('wheel', handleWheel);
    return () => {
      stage.off('wheel');
    };
  }, [zoom, panX, panY, setZoom, setPan]);

  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    if (selectedIds.length > 0) {
      const stage = stageRef.current;
      if (!stage) return;
      const nodes = selectedIds
        .map((id) => stage.findOne(`#${id}`))
        .filter(Boolean) as Konva.Node[];
      tr.nodes(nodes);
      tr.getLayer()?.batchDraw();
    } else {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
    }
  }, [selectedIds, elements]);

  const sortedElements = [...elements].sort((a, b) => a.z_index - b.z_index);

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      selectElement(null);
    }
  };

  const handleStageTouchStart = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (e.target === e.target.getStage()) {
      selectElement(null);
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={zoom}
        scaleY={zoom}
        x={panX}
        y={panY}
        onMouseDown={handleStageMouseDown}
        onTouchStart={handleStageTouchStart}
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={width / zoom}
            height={height / zoom}
            fill={backgroundColor}
            listening={false}
          />
          {sortedElements.map((el) => {
            const isSelected = selectedIds.includes(el.id);
            const commonProps = {
              key: el.id,
              element: el,
              isSelected,
              onSelect: () => selectElement(el.id),
              onChange: (updates: Partial<BoardElement>) => updateElement(el.id, updates),
              onCommit: () => commitHistory(),
            };

            if (el.type === 'image') return <CanvasImage {...commonProps} />;
            if (el.type === 'text') return <CanvasText {...commonProps} />;
            if (el.type === 'goal_card') return <CanvasGoalCard {...commonProps} onOpenGoal={onOpenGoal} />;
            if (el.type === 'sticker') return <CanvasSticker {...commonProps} />;
            return null;
          })}
          <Transformer
            ref={transformerRef}
            rotateEnabled
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            borderStroke="#0ea5e9"
            anchorStroke="#0ea5e9"
            anchorFill="#ffffff"
            anchorSize={8}
            anchorCornerRadius={4}
            rotateAnchorOffset={24}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 30 || newBox.height < 30) return oldBox;
              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
}
