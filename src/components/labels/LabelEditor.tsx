import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Text, Image as KonvaImage, Group, Rect, Transformer } from 'react-konva';
import Modal from '../ui/modal/index';
import { createClientLabelTemplate, updateClientLabelTemplate, previewClientLabelTemplate } from '../../serviceapi/api';

interface LabelElement {
  id: string;
  type: 'text' | 'barcode128' | 'image';
  x_mm: number;
  y_mm: number;
  w_mm?: number;
  h_mm?: number;
  value: string;
  font?: string;
  size?: number;
  align?: 'left' | 'center' | 'right';
  show_text?: boolean;
  imageFile?: File;
  imageDataUrl?: string;
}

interface LabelEditorProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: number;
  onSave: () => void;
  existingTemplate?: {
    id: number;
    name: string;
    template_data: any;
  } | null;
}

// Component for text element with transformer
const TextElement: React.FC<{
  element: LabelElement;
  x: number;
  y: number;
  w: number;
  h: number;
  isSelected: boolean;
  mmToPx: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<LabelElement>) => void;
}> = ({ element, x, y, w, h, isSelected, mmToPx, onSelect, onUpdate }) => {
  const groupRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      transformerRef.current?.nodes([]);
    }
  }, [isSelected]);

  // Calculate text dimensions for box
  const textWidth = (element.value.length * (element.size || 12) * 0.6);
  const textHeight = (element.size || 12) * 1.2;
  const boxWidth = Math.max(w, textWidth + 4);
  const boxHeight = Math.max(h, textHeight + 4);
  
  // Adjust position based on alignment
  let textX = 0;
  if (element.align === 'center') {
    textX = boxWidth / 2;
  } else if (element.align === 'right') {
    textX = boxWidth;
  }

  return (
    <>
      <Group
        ref={groupRef}
        x={x}
        y={y}
        draggable
        onClick={onSelect}
        onDragEnd={(e) => {
          const newX = e.target.x() / mmToPx;
          const newY = e.target.y() / mmToPx;
          onUpdate({ x_mm: newX, y_mm: newY });
        }}
      >
        {/* Box background */}
        <Rect
          x={0}
          y={0}
          width={boxWidth}
          height={boxHeight}
          fill="white"
          stroke={isSelected ? "#3b82f6" : "#e5e7eb"}
          strokeWidth={isSelected ? 2 : 1}
          shadowBlur={isSelected ? 5 : 0}
          shadowColor={isSelected ? "#3b82f6" : undefined}
        />
        {/* Text */}
        <Text
          x={textX}
          y={boxHeight / 2 - textHeight / 2}
          text={element.value}
          fontSize={element.size || 12}
          fontFamily={element.font || 'Helvetica'}
          align={element.align || 'left'}
          fill="black"
          offsetX={element.align === 'center' ? textWidth / 2 : element.align === 'right' ? textWidth : 0}
        />
      </Group>
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize - minimum size based on text
            const minWidth = textWidth + 4;
            const minHeight = textHeight + 4;
            if (Math.abs(newBox.width) < minWidth || Math.abs(newBox.height) < minHeight) {
              return oldBox;
            }
            return newBox;
          }}
          onTransformEnd={() => {
            const node = groupRef.current;
            if (!node) return;
            
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            
            // Reset scale
            node.scaleX(1);
            node.scaleY(1);
            
            const newWidth = boxWidth * scaleX;
            const newHeight = boxHeight * scaleY;
            const newX = node.x() / mmToPx;
            const newY = node.y() / mmToPx;
            
            onUpdate({
              x_mm: newX,
              y_mm: newY,
              w_mm: newWidth / mmToPx,
              h_mm: newHeight / mmToPx,
            });
          }}
        />
      )}
    </>
  );
};

// Component for image element with transformer
const ImageElement: React.FC<{
  element: LabelElement;
  x: number;
  y: number;
  w: number;
  h: number;
  isSelected: boolean;
  mmToPx: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<LabelElement>) => void;
}> = ({ element, x, y, w, h, isSelected, mmToPx, onSelect, onUpdate }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const imageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const groupRef = useRef<any>(null);

  useEffect(() => {
    if (element.imageDataUrl) {
      const img = new window.Image();
      img.onload = () => {
        setImage(img);
      };
      img.src = element.imageDataUrl;
    }
  }, [element.imageDataUrl]);

  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      transformerRef.current?.nodes([]);
    }
  }, [isSelected]);

  return (
    <>
      <Group
        ref={groupRef}
        x={x}
        y={y}
        draggable
        onClick={onSelect}
        onDragEnd={(e) => {
          const newX = e.target.x() / mmToPx;
          const newY = e.target.y() / mmToPx;
          onUpdate({ x_mm: newX, y_mm: newY });
        }}
      >
        {image && (
          <KonvaImage
            ref={imageRef}
            image={image}
            width={w}
            height={h}
            x={0}
            y={0}
          />
        )}
        {isSelected && (
          <Rect
            x={0}
            y={0}
            width={w}
            height={h}
            stroke="#3b82f6"
            strokeWidth={2}
            fill="transparent"
            listening={false}
          />
        )}
      </Group>
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
              return oldBox;
            }
            return newBox;
          }}
          onTransformEnd={() => {
            const node = groupRef.current;
            if (!node) return;
            
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            
            // Reset scale
            node.scaleX(1);
            node.scaleY(1);
            
            const newWidth = w * scaleX;
            const newHeight = h * scaleY;
            const newX = node.x() / mmToPx;
            const newY = node.y() / mmToPx;
            
            onUpdate({
              x_mm: newX,
              y_mm: newY,
              w_mm: newWidth / mmToPx,
              h_mm: newHeight / mmToPx,
            });
          }}
        />
      )}
    </>
  );
};

const LabelEditor: React.FC<LabelEditorProps> = ({ isOpen, onClose, clientId, onSave, existingTemplate }) => {
  const [templateName, setTemplateName] = useState('');
  const [widthMm, setWidthMm] = useState(100); // 10cm
  const [heightMm, setHeightMm] = useState(70); // 7cm
  const [elements, setElements] = useState<LabelElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [addedRequiredFields, setAddedRequiredFields] = useState<{
    nomeTrabalho: boolean;
    quantidade: boolean;
    tamanho: boolean;
  }>({
    nomeTrabalho: false,
    quantidade: false,
    tamanho: false,
  });
  
  // Load existing template when provided
  useEffect(() => {
    if (existingTemplate && isOpen) {
      setTemplateName(existingTemplate.name);
      const templateData = existingTemplate.template_data;
      
      if (templateData.page) {
        setWidthMm(templateData.page.width_mm || 100);
        setHeightMm(templateData.page.height_mm || 70);
      }
      
      if (templateData.elements && Array.isArray(templateData.elements)) {
        const loadedElements: LabelElement[] = templateData.elements.map((el: any) => ({
          id: `element-${Date.now()}-${Math.random()}`,
          type: el.type,
          x_mm: el.x_mm || 0,
          y_mm: el.y_mm || 0,
          w_mm: el.w_mm,
          h_mm: el.h_mm,
          value: el.value || '',
          font: el.font,
          size: el.size,
          align: el.align,
          show_text: el.show_text,
          imageDataUrl: el.type === 'image' ? el.value : undefined,
        }));
        setElements(loadedElements);
        
        // Update required fields status
        setAddedRequiredFields({
          nomeTrabalho: loadedElements.some(el => el.type === 'text' && el.value.includes('{{op.nome_trabalho')),
          quantidade: loadedElements.some(el => el.type === 'text' && el.value.includes('{{quantidade_por_caixa}}')),
          tamanho: loadedElements.some(el => el.type === 'text' && el.value.includes('{{tamanho_str}}')),
        });
      }
    } else if (isOpen && !existingTemplate) {
      // Reset when opening without existing template
      setTemplateName('');
      setWidthMm(100);
      setHeightMm(70);
      setElements([]);
      setSelectedElement(null);
      setAddedRequiredFields({
        nomeTrabalho: false,
        quantidade: false,
        tamanho: false,
      });
    }
  }, [existingTemplate, isOpen]);
  
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Scale factor para conversão mm para pixels (1mm = 3.779527559 pixels a 96 DPI)
  const mmToPx = 3.779527559;
  const stageWidth = widthMm * mmToPx;
  const stageHeight = heightMm * mmToPx;
  
  // Add default "Op: numero_empregado" element in bottom right corner
  useEffect(() => {
    if (elements.length === 0) {
      const defaultElement: LabelElement = {
        id: 'default-op',
        type: 'text',
        x_mm: widthMm - 30, // Bottom right
        y_mm: heightMm - 10,
        value: "Op: {{user.numero_empregado}}",
        font: 'Helvetica',
        size: 10,
        align: 'right',
      };
      setElements([defaultElement]);
    }
  }, [widthMm, heightMm, elements.length]);
  
  const handleAddRequiredField = (field: 'nomeTrabalho' | 'quantidade' | 'tamanho') => {
    let value = '';
    let yOffset = 0;
    
    if (field === 'nomeTrabalho') {
      value = '{{op.nome_trabalho}}';
      yOffset = -20; // Mais acima
    } else if (field === 'quantidade') {
      value = '{{quantidade_por_caixa}}';
      yOffset = 0; // Centro
    } else if (field === 'tamanho') {
      value = '{{tamanho_str}}';
      yOffset = 20; // Mais abaixo
    }
    
    const newElement: LabelElement = {
      id: `element-${Date.now()}`,
      type: 'text',
      x_mm: widthMm / 2,
      y_mm: heightMm / 2 + yOffset,
      w_mm: 40,
      h_mm: 5,
      value: value,
      font: 'Helvetica',
      size: 12,
      align: 'center',
    };
    
    setElements([...elements, newElement]);
    setAddedRequiredFields(prev => ({ ...prev, [field]: true }));
  };

  const handleAddElement = async (type: 'text' | 'barcode128' | 'image') => {
    if (type === 'image') {
      // Create file input to select image
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            const img = new window.Image();
            img.onload = () => {
              // Calculate dimensions in mm (maintain aspect ratio, max 50mm width)
              const maxWidthMm = 50;
              const aspectRatio = img.height / img.width;
              const w_mm = Math.min(maxWidthMm, (img.width * mmToPx) / mmToPx);
              const h_mm = w_mm * aspectRatio;
              
              const newElement: LabelElement = {
                id: `element-${Date.now()}`,
                type: 'image',
                x_mm: widthMm / 2 - w_mm / 2,
                y_mm: heightMm / 2 - h_mm / 2,
                w_mm: w_mm,
                h_mm: h_mm,
                value: file.name,
                imageFile: file,
                imageDataUrl: dataUrl,
              };
              setElements([...elements, newElement]);
              setSelectedElement(newElement.id);
            };
            img.src = dataUrl;
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }
    
    const newElement: LabelElement = {
      id: `element-${Date.now()}`,
      type,
      x_mm: widthMm / 2,
      y_mm: heightMm / 2,
      w_mm: type === 'text' ? 40 : 50,
      h_mm: type === 'text' ? 5 : 10,
      value: type === 'text' ? 'Text' : '{{op.id}}',
      font: 'Helvetica',
      size: 12,
      align: 'center',
      show_text: false,
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };
  
  const handleDeleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  };
  
  const handleUpdateElement = (id: string, updates: Partial<LabelElement>) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };
  
  const handleGeneratePreview = async () => {
    if (elements.length === 0) {
      alert('Adicione pelo menos um elemento à etiqueta antes de gerar o preview');
      return;
    }
    
    setIsGeneratingPreview(true);
    setPreviewImage(null);
    
    try {
      const token = localStorage.getItem("accessToken") || "";
      
      // Preparar template_data igual ao save
      const elementsWithImages = await Promise.all(elements.map(async (el) => {
        if (el.type === 'image' && el.imageDataUrl) {
          return {
            ...el,
            value: el.imageDataUrl,
          };
        }
        return el;
      }));
      
      const templateData = {
        page: {
          width_mm: widthMm,
          height_mm: heightMm,
        },
        elements: elementsWithImages.map(el => {
          const elementData: any = {
            type: el.type,
            x_mm: el.x_mm,
            y_mm: el.y_mm,
          };
          
          if (el.type === 'text') {
            elementData.value = el.value;
            elementData.font = el.font || 'Helvetica';
            elementData.size = el.size || 12;
            elementData.align = el.align || 'left';
          } else if (el.type === 'barcode128') {
            elementData.value = el.value;
            elementData.w_mm = el.w_mm || 50;
            elementData.h_mm = el.h_mm || 10;
            elementData.show_text = el.show_text !== undefined ? el.show_text : false;
          } else if (el.type === 'image') {
            elementData.value = el.value;
            elementData.w_mm = el.w_mm || 50;
            elementData.h_mm = el.h_mm || 50;
          }
          
          return elementData;
        }),
      };
      
      // Valores de exemplo para preview
      const quantidadePorCaixa = '250';
      const medida = '28x11x32';
      
      const result = await previewClientLabelTemplate(
        templateData,
        quantidadePorCaixa,
        medida,
        null, // op_id - null para usar dados mock
        token
      );
      
      if (result.preview_image) {
        // Remover prefixo duplicado se existir
        let imageData = result.preview_image;
        if (imageData.startsWith('data:image/png;base64,data:image')) {
          // Remover o primeiro prefixo
          imageData = imageData.replace('data:image/png;base64,', '');
        }
        // Garantir que tem o prefixo correto
        if (!imageData.startsWith('data:image')) {
          imageData = `data:image/png;base64,${imageData}`;
        }
        setPreviewImage(imageData);
        setShowPreviewModal(true);
      } else {
        alert('Erro ao gerar preview. Tente novamente.');
      }
    } catch (error: any) {
      console.error('Erro ao gerar preview:', error);
      alert(`Erro ao gerar preview: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert('Por favor, insira um nome para a etiqueta');
      return;
    }
    
    // Validate that required fields are present
    const hasNomeTrabalho = elements.some(el => 
      el.type === 'text' && (el.value.includes('{{op.nome_trabalho') || el.value.includes('nome_trabalho'))
    );
    const hasQuantidade = elements.some(el => 
      el.type === 'text' && el.value.includes('{{quantidade_por_caixa}}')
    );
    const hasTamanho = elements.some(el => 
      el.type === 'text' && el.value.includes('{{tamanho_str}}')
    );
    
    if (!hasNomeTrabalho || !hasQuantidade || !hasTamanho) {
      alert('A etiqueta deve conter: nome_trabalho, quantidade e tamanho. Por favor, adicione estes campos.');
      return;
    }
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem("accessToken") || "";
      
      // Convert images to base64 for storage
      const elementsWithImages = await Promise.all(elements.map(async (el) => {
        if (el.type === 'image' && el.imageDataUrl) {
          return {
            ...el,
            value: el.imageDataUrl, // Store base64 data URL
          };
        }
        return el;
      }));
      
      const templateData = {
        client: clientId,
        name: templateName,
        is_default: false,
        template_data: {
          page: {
            width_mm: widthMm,
            height_mm: heightMm,
          },
          elements: elementsWithImages.map(el => {
            const elementData: any = {
              type: el.type,
              x_mm: el.x_mm,
              y_mm: el.y_mm,
            };
            
            if (el.type === 'text') {
              elementData.value = el.value;
              elementData.font = el.font || 'Helvetica';
              elementData.size = el.size || 12;
              elementData.align = el.align || 'left';
            } else if (el.type === 'barcode128') {
              elementData.value = el.value;
              elementData.w_mm = el.w_mm || 50;
              elementData.h_mm = el.h_mm || 10;
              elementData.show_text = el.show_text !== undefined ? el.show_text : false;
            } else if (el.type === 'image') {
              elementData.value = el.value; // base64 data URL
              elementData.w_mm = el.w_mm || 50;
              elementData.h_mm = el.h_mm || 50;
            }
            
            return elementData;
          }),
        },
      };
      
      if (existingTemplate) {
        // Update existing template
        await updateClientLabelTemplate(existingTemplate.id, templateData, token);
      } else {
        // Create new template
        await createClientLabelTemplate(templateData, token);
      }
      
      onSave();
      onClose();
      // Reset form
      setTemplateName('');
      setElements([]);
      setSelectedElement(null);
      setAddedRequiredFields({
        nomeTrabalho: false,
        quantidade: false,
        tamanho: false,
      });
    } catch (error) {
      console.error('Erro ao salvar etiqueta:', error);
      alert('Erro ao salvar etiqueta. Por favor, tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const selectedElementData = elements.find(el => el.id === selectedElement);
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-6xl w-full"
    >
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Editor de Etiquetas</h2>
        
        <div className="mb-4">
          <label className="block mb-2">Nome da Etiqueta:</label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Ex: Etiqueta Padrão"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2">Largura (mm):</label>
            <input
              type="number"
              value={widthMm}
              onChange={(e) => setWidthMm(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
              min="10"
              max="500"
            />
          </div>
          <div>
            <label className="block mb-2">Altura (mm):</label>
            <input
              type="number"
              value={heightMm}
              onChange={(e) => setHeightMm(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
              min="10"
              max="500"
            />
          </div>
        </div>
        
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="border rounded p-4 bg-gray-50" ref={containerRef}>
              <Stage width={stageWidth} height={stageHeight} ref={stageRef}>
                <Layer>
                  {/* White background for label */}
                  <Rect
                    x={0}
                    y={0}
                    width={stageWidth}
                    height={stageHeight}
                    fill="white"
                    stroke="white"
                    strokeWidth={2}
                  />
                  
                  {elements.map((element) => {
                    const x = element.x_mm * mmToPx;
                    const y = element.y_mm * mmToPx;
                    const w = (element.w_mm || 40) * mmToPx;
                    const h = (element.h_mm || 5) * mmToPx;
                    const isSelected = selectedElement === element.id;
                    
                    if (element.type === 'text') {
                      return (
                        <TextElement
                          key={element.id}
                          element={element}
                          x={x}
                          y={y}
                          w={w}
                          h={h}
                          isSelected={isSelected}
                          mmToPx={mmToPx}
                          onSelect={() => setSelectedElement(element.id)}
                          onUpdate={(updates) => handleUpdateElement(element.id, updates)}
                        />
                      );
                    } else if (element.type === 'image' && element.imageDataUrl) {
                      return (
                        <ImageElement
                          key={element.id}
                          element={element}
                          x={x}
                          y={y}
                          w={w}
                          h={h}
                          isSelected={isSelected}
                          mmToPx={mmToPx}
                          onSelect={() => setSelectedElement(element.id)}
                          onUpdate={(updates) => handleUpdateElement(element.id, updates)}
                        />
                      );
                    } else if (element.type === 'barcode128') {
                      // Placeholder for barcode - you can improve this later
                      return (
                        <Group key={element.id} draggable onClick={() => setSelectedElement(element.id)}>
                          <Rect
                            x={x}
                            y={y}
                            width={w}
                            height={h}
                            fill="#f3f4f6"
                            stroke={isSelected ? "#3b82f6" : "#e5e7eb"}
                            strokeWidth={isSelected ? 2 : 1}
                            strokeDashArray={[5, 5]}
                            onDragEnd={(e) => {
                              const newX = e.target.x() / mmToPx;
                              const newY = e.target.y() / mmToPx;
                              handleUpdateElement(element.id, { x_mm: newX, y_mm: newY });
                            }}
                          />
                          <Text
                            x={x + w / 2}
                            y={y + h / 2}
                            text="Barcode"
                            fontSize={10}
                            align="center"
                            fill="#6b7280"
                            offsetY={5}
                          />
                        </Group>
                      );
                    }
                    return null;
                  })}
                  
                  {/* Transformer for selected element */}
                  {selectedElement && (() => {
                    const selectedEl = elements.find(el => el.id === selectedElement);
                    if (selectedEl && selectedEl.type === 'image') {
                      return null; // Transformer is handled in image group
                    }
                    return null;
                  })()}
                </Layer>
              </Stage>
            </div>
          </div>
          
          <div className="w-80 border rounded p-4">
            <div className="mb-4">
              <h3 className="font-bold mb-2">Adicionar Elemento:</h3>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleAddElement('text')}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Adicionar Texto
                </button>
                <button
                  type="button"
                  onClick={() => handleAddElement('barcode128')}
                  className="bg-green-500 text-white px-4 py-2 rounded"
                >
                  Adicionar Código de Barras
                </button>
                <button
                  type="button"
                  onClick={() => handleAddElement('image')}
                  className="bg-purple-500 text-white px-4 py-2 rounded"
                >
                  Adicionar Imagem
                </button>
              </div>
            </div>
            
            {selectedElementData && (
              <div className="border-t pt-4">
                <h3 className="font-bold mb-2">Propriedades:</h3>
                {selectedElementData.type === 'text' && (
                  <>
                    <div className="mb-2">
                      <label className="block text-sm">Valor:</label>
                      <input
                        type="text"
                        value={selectedElementData.value}
                        onChange={(e) => handleUpdateElement(selectedElementData.id, { value: e.target.value })}
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm">Tamanho da Fonte:</label>
                      <input
                        type="number"
                        value={selectedElementData.size || 12}
                        onChange={(e) => handleUpdateElement(selectedElementData.id, { size: Number(e.target.value) })}
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm">Alinhamento:</label>
                      <select
                        value={selectedElementData.align || 'left'}
                        onChange={(e) => handleUpdateElement(selectedElementData.id, { align: e.target.value as any })}
                        className="w-full border rounded px-2 py-1 text-sm"
                      >
                        <option value="left">Esquerda</option>
                        <option value="center">Centro</option>
                        <option value="right">Direita</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteElement(selectedElementData.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Remover
                    </button>
                  </>
                )}
                {selectedElementData.type === 'barcode128' && (
                  <>
                    <div className="mb-2">
                      <label className="block text-sm">Valor:</label>
                      <input
                        type="text"
                        value={selectedElementData.value}
                        onChange={(e) => handleUpdateElement(selectedElementData.id, { value: e.target.value })}
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm">Largura (mm):</label>
                      <input
                        type="number"
                        value={selectedElementData.w_mm || 50}
                        onChange={(e) => handleUpdateElement(selectedElementData.id, { w_mm: Number(e.target.value) })}
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm">Altura (mm):</label>
                      <input
                        type="number"
                        value={selectedElementData.h_mm || 10}
                        onChange={(e) => handleUpdateElement(selectedElementData.id, { h_mm: Number(e.target.value) })}
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteElement(selectedElementData.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Remover
                    </button>
                  </>
                )}
                {selectedElementData.type === 'image' && (
                  <>
                    <div className="mb-2">
                      <label className="block text-sm">Arquivo:</label>
                      <div className="text-xs text-gray-600 mb-2">{selectedElementData.value}</div>
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const dataUrl = event.target?.result as string;
                                handleUpdateElement(selectedElementData.id, {
                                  value: file.name,
                                  imageDataUrl: dataUrl,
                                  imageFile: file,
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Trocar Imagem
                      </button>
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm">Largura (mm):</label>
                      <input
                        type="number"
                        value={selectedElementData.w_mm?.toFixed(1) || 50}
                        onChange={(e) => handleUpdateElement(selectedElementData.id, { w_mm: Number(e.target.value) })}
                        className="w-full border rounded px-2 py-1 text-sm"
                        step="0.1"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm">Altura (mm):</label>
                      <input
                        type="number"
                        value={selectedElementData.h_mm?.toFixed(1) || 50}
                        onChange={(e) => handleUpdateElement(selectedElementData.id, { h_mm: Number(e.target.value) })}
                        className="w-full border rounded px-2 py-1 text-sm"
                        step="0.1"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteElement(selectedElementData.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Remover
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Valores obrigatórios */}
        <div className="mt-4 p-3 bg-gray-50 border rounded">
          <h3 className="font-semibold mb-2 text-sm">Valores Obrigatórios:</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleAddRequiredField('nomeTrabalho')}
              disabled={addedRequiredFields.nomeTrabalho}
              className={`flex items-center gap-2 px-3 py-2 rounded ${
                addedRequiredFields.nomeTrabalho 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {addedRequiredFields.nomeTrabalho && (
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-sm">Nome Trabalho</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddRequiredField('quantidade')}
              disabled={addedRequiredFields.quantidade}
              className={`flex items-center gap-2 px-3 py-2 rounded ${
                addedRequiredFields.quantidade 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {addedRequiredFields.quantidade && (
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-sm">Quantidade</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddRequiredField('tamanho')}
              disabled={addedRequiredFields.tamanho}
              className={`flex items-center gap-2 px-3 py-2 rounded ${
                addedRequiredFields.tamanho 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {addedRequiredFields.tamanho && (
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-sm">Tamanho</span>
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <button
            type="button"
            onClick={handleGeneratePreview}
            disabled={isGeneratingPreview || elements.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPreview ? 'Gerando Preview...' : 'Gerar Preview'}
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar Etiqueta'}
            </button>
          </div>
        </div>
        
        {/* Modal de Preview */}
        {showPreviewModal && previewImage && (
          <Modal
            isOpen={showPreviewModal}
            onClose={() => setShowPreviewModal(false)}
            className="max-w-4xl w-full"
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Preview da Etiqueta</h2>
              <div className="border rounded p-4 bg-gray-50 flex justify-center">
                <img
                  src={previewImage.startsWith('data:image') ? previewImage : `data:image/png;base64,${previewImage}`}
                  alt="Preview da Etiqueta"
                  className="max-w-full h-auto"
                />
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
                >
                  Fechar
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Modal>
  );
};

export default LabelEditor;

