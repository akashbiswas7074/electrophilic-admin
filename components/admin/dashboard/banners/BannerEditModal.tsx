"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { updateBannerSettings } from "@/lib/database/actions/admin/banners/banner-settings.actions";
import { useToast } from "@/components/ui/use-toast";

interface Banner {
	_id: string;
	public_id: string;
	url: string;
	platform: "desktop" | "mobile";
	linkUrl?: string;
	altText?: string;
	startDate?: string | Date | null;
	endDate?: string | Date | null;
	isActive: boolean;
	priority: number;
	impressions?: number;
	clicks?: number;
}

interface BannerEditModalProps {
	banner: Banner | null;
	isOpen: boolean;
	onClose: () => void;
	onSave: () => void;
}

export default function BannerEditModal({
	banner,
	isOpen,
	onClose,
	onSave,
}: BannerEditModalProps) {
	const { toast } = useToast();
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState<{
		linkUrl: string;
		altText: string;
		platform: "desktop" | "mobile";
		priority: number;
		isActive: boolean;
		startDate: Date | null;
		endDate: Date | null;
	}>({
		linkUrl: "",
		altText: "",
		platform: "desktop",
		priority: 10,
		isActive: true,
		startDate: null,
		endDate: null,
	});

	useEffect(() => {
		if (banner) {
			setFormData({
				linkUrl: banner.linkUrl || "",
				altText: banner.altText || "",
				platform: banner.platform,
				priority: banner.priority || 10,
				isActive: banner.isActive !== false,
				startDate: banner.startDate ? new Date(banner.startDate) : null,
				endDate: banner.endDate ? new Date(banner.endDate) : null,
			});
		}
	}, [banner]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!banner) return;

		setIsLoading(true);
		try {
			const result = await updateBannerSettings(banner.public_id, {
				linkUrl: formData.linkUrl,
				altText: formData.altText,
				platform: formData.platform,
				priority: formData.priority,
				isActive: formData.isActive,
				startDate: formData.startDate,
				endDate: formData.endDate,
			});

			if (result.success) {
				toast({
					title: "Banner Updated",
					description: "The banner settings have been successfully updated.",
				});
				onSave();
			} else {
				toast({
					variant: "destructive",
					title: "Update Failed",
					description: result.message || "Failed to update banner settings.",
				});
			}
		} catch (error: any) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					error.message || "An error occurred while updating the banner.",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Edit Banner</DialogTitle>
					<DialogDescription>
						Update banner details including scheduling and visibility settings.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						{banner && (
							<div className="mb-4 flex justify-center">
								<img
									src={banner.url}
									alt={banner.altText || "Banner image"}
									className="h-40 w-auto object-contain rounded-md border border-border"
								/>
							</div>
						)}

						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="platform" className="text-right">
								Platform
							</Label>
							<Select
								value={formData.platform}
								onValueChange={(value: "desktop" | "mobile") =>
									setFormData({ ...formData, platform: value })
								}
							>
								<SelectTrigger id="platform" className="col-span-3">
									<SelectValue placeholder="Select platform" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="desktop">Desktop</SelectItem>
									<SelectItem value="mobile">Mobile</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="altText" className="text-right">
								Alt Text
							</Label>
							<Input
								id="altText"
								value={formData.altText}
								onChange={(e) =>
									setFormData({ ...formData, altText: e.target.value })
								}
								className="col-span-3"
							/>
						</div>

						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="linkUrl" className="text-right">
								Link URL
							</Label>
							<Input
								id="linkUrl"
								value={formData.linkUrl}
								onChange={(e) =>
									setFormData({ ...formData, linkUrl: e.target.value })
								}
								className="col-span-3"
							/>
						</div>

						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="priority" className="text-right">
								Priority
							</Label>
							<Select
								value={formData.priority.toString()}
								onValueChange={(value) =>
									setFormData({ ...formData, priority: parseInt(value) })
								}
							>
								<SelectTrigger id="priority" className="col-span-3">
									<SelectValue placeholder="Set priority" />
								</SelectTrigger>
								<SelectContent>
									{[0, 1, 2, 3, 4, 5, 10, 20, 50, 100].map((p) => (
										<SelectItem key={p} value={p.toString()}>
											{p}{" "}
											{p === 0 ? "(Highest)" : p === 100 ? "(Lowest)" : ""}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="isActive" className="text-right">
								Status
							</Label>
							<div className="flex items-center space-x-2 col-span-3">
								<Switch
									id="isActive"
									checked={formData.isActive}
									onCheckedChange={(checked) =>
										setFormData({ ...formData, isActive: checked })
									}
								/>
								<Label htmlFor="isActive">
									{formData.isActive ? "Active" : "Inactive"}
								</Label>
							</div>
						</div>

						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="startDate" className="text-right">
								Start Date
							</Label>
							<div className="col-span-3">
								<Popover>
									<PopoverTrigger asChild>
										<Button
											id="startDate"
											variant="outline"
											className={cn(
												"w-full justify-start text-left font-normal",
												!formData.startDate && "text-muted-foreground"
											)}
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{formData.startDate ? (
												format(formData.startDate, "PPP")
											) : (
												<span>No start date (show immediately)</span>
											)}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0">
										<Calendar
											mode="single"
											selected={formData.startDate || undefined}
											onSelect={(date) =>
												setFormData({ ...formData, startDate: date || null })
											}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
								{formData.startDate && (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="mt-2"
										onClick={() => setFormData({ ...formData, startDate: null })}
									>
										Clear date
									</Button>
								)}
							</div>
						</div>

						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="endDate" className="text-right">
								End Date
							</Label>
							<div className="col-span-3">
								<Popover>
									<PopoverTrigger asChild>
										<Button
											id="endDate"
											variant="outline"
											className={cn(
												"w-full justify-start text-left font-normal",
												!formData.endDate && "text-muted-foreground"
											)}
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{formData.endDate ? (
												format(formData.endDate, "PPP")
											) : (
												<span>No end date (show indefinitely)</span>
											)}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0">
										<Calendar
											mode="single"
											selected={formData.endDate || undefined}
											onSelect={(date) =>
												setFormData({ ...formData, endDate: date || null })
											}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
								{formData.endDate && (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="mt-2"
										onClick={() => setFormData({ ...formData, endDate: null })}
									>
										Clear date
									</Button>
								)}
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isLoading}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
								</>
							) : (
								"Save Changes"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}