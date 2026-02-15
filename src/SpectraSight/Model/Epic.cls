Class SpectraSight.Model.Epic Extends SpectraSight.Model.Ticket
{

Property StartDate As %Date(%JSONFIELDNAME = "startDate");

Property TargetDate As %Date(%JSONFIELDNAME = "targetDate");

Storage Default
{
<Data name="EpicDefaultData">
<Subscript>"Epic"</Subscript>
<Value name="1">
<Value>StartDate</Value>
</Value>
<Value name="2">
<Value>TargetDate</Value>
</Value>
</Data>
<DefaultData>EpicDefaultData</DefaultData>
<Type>%Storage.Persistent</Type>
}

}
