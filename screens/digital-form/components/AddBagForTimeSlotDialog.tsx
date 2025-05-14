// Thêm vào ImprovedWorkerCard.tsx
const AddBagForTimeSlotDialog = ({
    open,
    onOpenChange,
    worker,
    timeSlot,
    onAddBag
}) => {
    const [selectedBag, setSelectedBag] = useState('');
    const [selectedProcess, setSelectedProcess] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [quantity, setQuantity] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get bag options
    const { data: bags } = useQuery(['bags'], () => [...]);
    const { data: processes } = useQuery(['processes'], () => [...]);
    const { data: colors } = useQuery(['colors'], () => [...]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedBag || !selectedProcess || !selectedColor) return;

        setIsSubmitting(true);

        try {
            const bagData = {
                bagId: selectedBag,
                bagName: bags.find(b => b.id === selectedBag)?.name,
                processId: selectedProcess,
                processName: processes.find(p => p.id === selectedProcess)?.name,
                colorId: selectedColor,
                colorName: colors.find(c => c.id === selectedColor)?.name,
                timeSlot,
                quantity
            };

            const success = await onAddBag(bagData);

            if (success) {
                onOpenChange(false);
            }
        } catch (error) {
            console.error('Error adding bag:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Thêm túi mới cho khung giờ {timeSlot}</DialogTitle>
                    <DialogDescription>
                        Thêm loại túi mới cho công nhân {worker.name} trong khung giờ {timeSlot}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Form fields for bags, processes, colors and quantity */}
                    {/* ... */}

                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang thêm...
                                </>
                            ) : (
                                'Thêm túi'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};