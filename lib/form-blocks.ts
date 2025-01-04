import { FormBlocksType } from '@/@types/form-block.type';
import { RowLayoutBlock } from '../components/blocks/layouts/RowLayout';
import { RadioSelectBlock } from '@/components/blocks/RadioSelectBlock';



export const FormBlocks: FormBlocksType = {
   RowLayout: RowLayoutBlock, 
   RadioSelect: RadioSelectBlock,
}