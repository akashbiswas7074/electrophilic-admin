"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Save, Eye, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  getShippingReturns, 
  upsertShippingReturns, 
  getAllShippingReturns,
  deleteShippingReturns,
  activateShippingReturns 
} from "@/lib/database/actions/admin/shipping-returns/shipping-returns.actions";

interface ShippingOption {
  title: string;
  description: string;
  icon: string;
  minOrderAmount: number;
  deliveryTime: string;
  cost: number;
  isActive: boolean;
  order: number;
}

interface ReturnInfo {
  title: string;
  description: string;
  icon: string;
  returnPeriodDays: number;
  conditions: string[];
  isActive: boolean;
  order: number;
}

interface ConfigData {
  _id?: string;
  title: string;
  subtitle: string;
  shippingOptions: ShippingOption[];
  returnInfo: ReturnInfo[];
  additionalInfo: string;
  metaTitle: string;
  metaDescription: string;
  customCSS: string;
  isActive?: boolean;
  lastUpdatedBy?: string;
  updatedAt?: string;
}

export default function ShippingReturnsManager() {
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState<ConfigData[]>([]);
  const [activeConfig, setActiveConfig] = useState<ConfigData>({
    title: "Shipping & Returns",
    subtitle: "Fast delivery and easy returns",
    shippingOptions: [],
    returnInfo: [],
    additionalInfo: "",
    metaTitle: "",
    metaDescription: "",
    customCSS: "",
  });
  const [previewMode, setPreviewMode] = useState(false);

  // Load active configuration on component mount
  useEffect(() => {
    loadActiveConfig();
    loadAllConfigs();
  }, []);

  const loadActiveConfig = async () => {
    try {
      const result = await getShippingReturns();
      if (result.success && result.config) {
        setActiveConfig(result.config);
      }
    } catch (error) {
      console.error("Error loading config:", error);
      toast({
        title: "Error",
        description: "Failed to load shipping & returns configuration",
        variant: "destructive",
      });
    }
  };

  const loadAllConfigs = async () => {
    try {
      const result = await getAllShippingReturns();
      if (result.success) {
        setConfigs(result.configs);
      }
    } catch (error) {
      console.error("Error loading configs:", error);
    }
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      const result = await upsertShippingReturns(activeConfig);
      if (result.success) {
        toast({
          title: "Success",
          description: "Shipping & returns configuration saved successfully",
        });
        setActiveConfig(result.config);
        loadAllConfigs();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to save configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while saving",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Shipping Options Management
  const addShippingOption = () => {
    const newOption: ShippingOption = {
      title: "",
      description: "",
      icon: "🚚",
      minOrderAmount: 0,
      deliveryTime: "",
      cost: 0,
      isActive: true,
      order: activeConfig.shippingOptions.length,
    };
    setActiveConfig({
      ...activeConfig,
      shippingOptions: [...activeConfig.shippingOptions, newOption],
    });
  };

  const updateShippingOption = (index: number, field: keyof ShippingOption, value: any) => {
    const updatedOptions = [...activeConfig.shippingOptions];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };
    setActiveConfig({ ...activeConfig, shippingOptions: updatedOptions });
  };

  const removeShippingOption = (index: number) => {
    const updatedOptions = activeConfig.shippingOptions.filter((_, i) => i !== index);
    const reorderedOptions = updatedOptions.map((option, i) => ({
      ...option,
      order: i,
    }));
    setActiveConfig({ ...activeConfig, shippingOptions: reorderedOptions });
  };

  const moveShippingOption = (index: number, direction: 'up' | 'down') => {
    const newOptions = [...activeConfig.shippingOptions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newOptions.length) {
      [newOptions[index], newOptions[targetIndex]] = [newOptions[targetIndex], newOptions[index]];
      
      newOptions.forEach((option, i) => {
        option.order = i;
      });
      
      setActiveConfig({ ...activeConfig, shippingOptions: newOptions });
    }
  };

  // Return Info Management
  const addReturnInfo = () => {
    const newInfo: ReturnInfo = {
      title: "",
      description: "",
      icon: "🔄",
      returnPeriodDays: 30,
      conditions: [],
      isActive: true,
      order: activeConfig.returnInfo.length,
    };
    setActiveConfig({
      ...activeConfig,
      returnInfo: [...activeConfig.returnInfo, newInfo],
    });
  };

  const updateReturnInfo = (index: number, field: keyof ReturnInfo, value: any) => {
    const updatedInfo = [...activeConfig.returnInfo];
    updatedInfo[index] = { ...updatedInfo[index], [field]: value };
    setActiveConfig({ ...activeConfig, returnInfo: updatedInfo });
  };

  const removeReturnInfo = (index: number) => {
    const updatedInfo = activeConfig.returnInfo.filter((_, i) => i !== index);
    const reorderedInfo = updatedInfo.map((info, i) => ({
      ...info,
      order: i,
    }));
    setActiveConfig({ ...activeConfig, returnInfo: reorderedInfo });
  };

  const moveReturnInfo = (index: number, direction: 'up' | 'down') => {
    const newInfo = [...activeConfig.returnInfo];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newInfo.length) {
      [newInfo[index], newInfo[targetIndex]] = [newInfo[targetIndex], newInfo[index]];
      
      newInfo.forEach((info, i) => {
        info.order = i;
      });
      
      setActiveConfig({ ...activeConfig, returnInfo: newInfo });
    }
  };

  // Conditions Management
  const addCondition = (returnIndex: number) => {
    const updatedInfo = [...activeConfig.returnInfo];
    updatedInfo[returnIndex].conditions = [...updatedInfo[returnIndex].conditions, ""];
    setActiveConfig({ ...activeConfig, returnInfo: updatedInfo });
  };

  const updateCondition = (returnIndex: number, conditionIndex: number, value: string) => {
    const updatedInfo = [...activeConfig.returnInfo];
    updatedInfo[returnIndex].conditions[conditionIndex] = value;
    setActiveConfig({ ...activeConfig, returnInfo: updatedInfo });
  };

  const removeCondition = (returnIndex: number, conditionIndex: number) => {
    const updatedInfo = [...activeConfig.returnInfo];
    updatedInfo[returnIndex].conditions = updatedInfo[returnIndex].conditions.filter((_, i) => i !== conditionIndex);
    setActiveConfig({ ...activeConfig, returnInfo: updatedInfo });
  };

  const activateConfig = async (configId: string) => {
    try {
      const result = await activateShippingReturns(configId);
      if (result.success) {
        toast({
          title: "Success",
          description: "Configuration activated successfully",
        });
        loadActiveConfig();
        loadAllConfigs();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to activate configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while activating configuration",
        variant: "destructive",
      });
    }
  };

  const deleteConfig = async (configId: string) => {
    if (!confirm("Are you sure you want to delete this configuration?")) return;
    
    try {
      const result = await deleteShippingReturns(configId);
      if (result.success) {
        toast({
          title: "Success",
          description: "Configuration deleted successfully",
        });
        loadAllConfigs();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting configuration",
        variant: "destructive",
      });
    }
  };

  if (previewMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Configuration Preview</h2>
            <Button onClick={() => setPreviewMode(false)} variant="outline">
              Back to Editor
            </Button>
          </div>
          
          {/* Preview Content */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-2">{activeConfig.title}</h3>
            {activeConfig.subtitle && (
              <p className="text-gray-600 mb-6">{activeConfig.subtitle}</p>
            )}

            {/* Shipping Options Preview */}
            {activeConfig.shippingOptions
              .filter(option => option.isActive)
              .sort((a, b) => a.order - b.order)
              .map((option, index) => (
                <div key={index} className="mb-4 p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{option.icon}</span>
                    <div>
                      <h4 className="font-semibold">{option.title}</h4>
                      <p className="text-sm text-gray-600">{option.description}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        Delivery: {option.deliveryTime} • Cost: {option.cost === 0 ? 'Free' : `₹${option.cost}`}
                        {option.minOrderAmount > 0 && ` (min order ₹${option.minOrderAmount})`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {/* Return Info Preview */}
            {activeConfig.returnInfo
              .filter(info => info.isActive)
              .sort((a, b) => a.order - b.order)
              .map((info, index) => (
                <div key={index} className="mb-4 p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{info.icon}</span>
                    <div>
                      <h4 className="font-semibold">{info.title}</h4>
                      <p className="text-sm text-gray-600">{info.description}</p>
                      {info.conditions && info.conditions.length > 0 && (
                        <ul className="text-xs text-gray-500 mt-2 list-disc list-inside">
                          {info.conditions.map((condition, i) => (
                            <li key={i}>{condition}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            {activeConfig.additionalInfo && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{activeConfig.additionalInfo}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shipping & Returns Manager</h1>
          <p className="text-muted-foreground">Manage shipping options and return policies</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setPreviewMode(true)} variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSaveConfig} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>

      {/* Configuration Versions */}
      {configs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration Versions</CardTitle>
            <CardDescription>Manage different versions of your shipping & returns configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {configs.map((config) => (
                <div key={config._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{config.title}</h3>
                      {config.isActive && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Updated {config.updatedAt ? new Date(config.updatedAt).toLocaleDateString() : 'Unknown'} 
                      {config.lastUpdatedBy && ` by ${config.lastUpdatedBy}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!config.isActive && (
                      <Button
                        onClick={() => activateConfig(config._id!)}
                        size="sm"
                        variant="outline"
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      onClick={() => deleteConfig(config._id!)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Configure the main details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={activeConfig.title}
                onChange={(e) => setActiveConfig({ ...activeConfig, title: e.target.value })}
                placeholder="Shipping & Returns"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={activeConfig.subtitle}
                onChange={(e) => setActiveConfig({ ...activeConfig, subtitle: e.target.value })}
                placeholder="Fast delivery and easy returns"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Additional Information</Label>
              <Textarea
                id="additionalInfo"
                value={activeConfig.additionalInfo}
                onChange={(e) => setActiveConfig({ ...activeConfig, additionalInfo: e.target.value })}
                placeholder="Any additional information..."
                className="min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* SEO Settings */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
            <CardDescription>Optimize for search engines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                value={activeConfig.metaTitle}
                onChange={(e) => setActiveConfig({ ...activeConfig, metaTitle: e.target.value })}
                placeholder="Shipping & Returns - Your Store"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                value={activeConfig.metaDescription}
                onChange={(e) => setActiveConfig({ ...activeConfig, metaDescription: e.target.value })}
                placeholder="Learn about our shipping options and return policy..."
                className="min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipping Options */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Shipping Options</CardTitle>
            <CardDescription>Configure available shipping methods</CardDescription>
          </div>
          <Button onClick={addShippingOption} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Shipping Option
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeConfig.shippingOptions.map((option, index) => (
              <Card key={index} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <Button
                          onClick={() => moveShippingOption(index, 'up')}
                          disabled={index === 0}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => moveShippingOption(index, 'down')}
                          disabled={index === activeConfig.shippingOptions.length - 1}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Shipping Option {index + 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={option.isActive}
                        onCheckedChange={(checked) => updateShippingOption(index, 'isActive', checked)}
                      />
                      <Button
                        onClick={() => removeShippingOption(index)}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={option.title}
                        onChange={(e) => updateShippingOption(index, 'title', e.target.value)}
                        placeholder="Free Standard Shipping"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <Input
                        value={option.icon}
                        onChange={(e) => updateShippingOption(index, 'icon', e.target.value)}
                        placeholder="🚚"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={option.description}
                      onChange={(e) => updateShippingOption(index, 'description', e.target.value)}
                      placeholder="On all orders above ₹999. Orders typically arrive within 5-7 business days."
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Delivery Time</Label>
                      <Input
                        value={option.deliveryTime}
                        onChange={(e) => updateShippingOption(index, 'deliveryTime', e.target.value)}
                        placeholder="5-7 business days"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cost (₹)</Label>
                      <Input
                        type="number"
                        value={option.cost}
                        onChange={(e) => updateShippingOption(index, 'cost', Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Min Order Amount (₹)</Label>
                      <Input
                        type="number"
                        value={option.minOrderAmount}
                        onChange={(e) => updateShippingOption(index, 'minOrderAmount', Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {activeConfig.shippingOptions.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No shipping options added yet. Click "Add Shipping Option" to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Return Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Return Information</CardTitle>
            <CardDescription>Configure return policies and conditions</CardDescription>
          </div>
          <Button onClick={addReturnInfo} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Return Info
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeConfig.returnInfo.map((info, index) => (
              <Card key={index} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <Button
                          onClick={() => moveReturnInfo(index, 'up')}
                          disabled={index === 0}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => moveReturnInfo(index, 'down')}
                          disabled={index === activeConfig.returnInfo.length - 1}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Return Info {index + 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={info.isActive}
                        onCheckedChange={(checked) => updateReturnInfo(index, 'isActive', checked)}
                      />
                      <Button
                        onClick={() => removeReturnInfo(index)}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={info.title}
                        onChange={(e) => updateReturnInfo(index, 'title', e.target.value)}
                        placeholder="30-Day Returns"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <Input
                        value={info.icon}
                        onChange={(e) => updateReturnInfo(index, 'icon', e.target.value)}
                        placeholder="🔄"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={info.description}
                      onChange={(e) => updateReturnInfo(index, 'description', e.target.value)}
                      placeholder="Not completely satisfied? Return unworn items within 30 days for a full refund."
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Return Period (Days)</Label>
                    <Input
                      type="number"
                      value={info.returnPeriodDays}
                      onChange={(e) => updateReturnInfo(index, 'returnPeriodDays', Number(e.target.value))}
                      placeholder="30"
                    />
                  </div>
                  
                  {/* Conditions */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Return Conditions</Label>
                      <Button
                        onClick={() => addCondition(index)}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Condition
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {info.conditions.map((condition, conditionIndex) => (
                        <div key={conditionIndex} className="flex gap-2">
                          <Input
                            value={condition}
                            onChange={(e) => updateCondition(index, conditionIndex, e.target.value)}
                            placeholder="Enter condition..."
                            className="flex-1"
                          />
                          <Button
                            onClick={() => removeCondition(index, conditionIndex)}
                            size="sm"
                            variant="destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {activeConfig.returnInfo.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No return information added yet. Click "Add Return Info" to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom CSS */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Styling</CardTitle>
          <CardDescription>Add custom CSS for advanced styling</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={activeConfig.customCSS}
            onChange={(e) => setActiveConfig({ ...activeConfig, customCSS: e.target.value })}
            placeholder="/* Custom CSS styles */"
            className="min-h-[120px] font-mono text-sm"
          />
        </CardContent>
      </Card>
    </div>
  );
}